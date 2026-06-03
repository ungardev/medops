"""
Cloudflare R2 Storage Utility for MEDOPZ
Handles file uploads to R2 bucket for permanent document storage.
"""

import boto3
import logging
from django.conf import settings
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Optional

logger = logging.getLogger(__name__)


class R2StorageClient:
    """
    Client for Cloudflare R2 S3-compatible storage.
    All configuration is read from environment variables to protect credentials.
    """

    _instance: Optional["R2StorageClient"] = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def client(self):
        if self._client is None:
            account_id = settings.CLOUDFLARE_R2_ACCOUNT_ID
            access_key_id = settings.CLOUDFLARE_R2_ACCESS_KEY_ID
            secret_access_key = settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY
            endpoint_url = settings.CLOUDFLARE_R2_ENDPOINT_URL

            if not all([account_id, access_key_id, secret_access_key, endpoint_url]):
                logger.warning(
                    "R2 configuration incomplete. R2 uploads will be skipped."
                )
                return None

            self._client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name="auto",
                config=Config(signature_version="s3v4"),
            )
        return self._client

    @property
    def bucket_name(self) -> str:
        return settings.CLOUDFLARE_R2_BUCKET_NAME

    @property
    def public_url_base(self) -> str:
        custom_url = getattr(settings, "CLOUDFLARE_R2_PUBLIC_URL_BASE", "")
        if custom_url:
            return custom_url.rstrip("/")
        return f"https://{self.bucket_name}.{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    def upload_file(
        self,
        file_content: bytes,
        object_key: str,
        content_type: str = "application/pdf",
    ) -> Optional[str]:
        """
        Upload a file to R2 and return the public URL.

        Args:
            file_content: Raw bytes of the file
            object_key: Path/filename in the bucket (e.g., 'medical_documents/2026/05/27/file.pdf')
            content_type: MIME type of the file

        Returns:
            Public URL of the uploaded file, or None if upload failed
        """
        if self.client is None:
            logger.error("R2 client not initialized - missing configuration")
            return None

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_content,
                ContentType=content_type,
            )
            public_url = f"{self.public_url_base}/{object_key}"
            logger.info(f"Successfully uploaded to R2: {object_key}")
            return public_url
        except ClientError as e:
            logger.error(f"Failed to upload to R2: {e}")
            return None

    def upload_image(
        self,
        file_content: bytes,
        object_key: str,
        content_type: str = "image/png",
    ) -> Optional[str]:
        """
        Upload an image file to R2 and return the public URL.

        Args:
            file_content: Raw bytes of the image
            object_key: Path/filename in the bucket (e.g., 'logos/institution_1/logo.png')
            content_type: MIME type of the image

        Returns:
            Public URL of the uploaded file, or None if upload failed
        """
        return self.upload_file(file_content, object_key, content_type)

    def delete_file(self, object_key: str) -> bool:
        """
        Delete a file from R2.

        Args:
            object_key: Path/filename in the bucket

        Returns:
            True if deletion was successful, False otherwise
        """
        if self.client is None:
            return False

        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key,
            )
            logger.info(f"Successfully deleted from R2: {object_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete from R2: {e}")
            return False

    def get_public_url(self, object_key: str) -> str:
        """
        Build public URL for a file in R2.

        Args:
            object_key: Path/filename in the bucket

        Returns:
            Public URL of the file
        """
        return f"{self.public_url_base}/{object_key}"

    def file_exists(self, object_key: str) -> bool:
        """
        Check if a file exists in R2.

        Args:
            object_key: Path/filename in the bucket

        Returns:
            True if file exists, False otherwise
        """
        if self.client is None:
            return False

        try:
            self.client.head_object(
                Bucket=self.bucket_name,
                Key=object_key,
            )
            return True
        except ClientError:
            return False


def get_r2_client() -> R2StorageClient:
    """Factory function to get the R2 storage client singleton."""
    return R2StorageClient()


def upload_medical_document(
    file_content: bytes, category: str, filename: str
) -> Optional[str]:
    """
    Upload a medical document to R2 with proper path structure.

    Args:
        file_content: Raw bytes of the PDF
        category: Document category (e.g., 'prescription', 'treatment', 'medical_report')
        filename: Original filename

    Returns:
        Public URL of the uploaded file, or None if upload failed
    """
    from datetime import datetime

    client = get_r2_client()
    date_path = datetime.now().strftime("%Y/%m/%d")
    object_key = f"medical_documents/{date_path}/{filename}"
    return client.upload_file(file_content, object_key, "application/pdf")


def upload_medical_report_pdf(
    file_content: bytes, report_id: int, filename: str
) -> Optional[str]:
    """
    Upload a medical report PDF to R2.

    Args:
        file_content: Raw bytes of the PDF
        report_id: MedicalReport ID
        filename: Original filename

    Returns:
        Public URL of the uploaded file, or None if upload failed
    """
    from datetime import datetime

    client = get_r2_client()
    date_path = datetime.now().strftime("%Y/%m/%d")
    object_key = f"medical_reports/{date_path}/report_{report_id}_{filename}"
    return client.upload_file(file_content, object_key, "application/pdf")


def upload_institution_logo(
    file_content: bytes, institution_id: int, filename: str
) -> Optional[str]:
    """
    Upload an institution logo to R2 with proper path structure.
    Logos are stored permanently in R2 to persist across deployments.

    Args:
        file_content: Raw bytes of the image
        institution_id: InstitutionSettings ID
        filename: Original filename (e.g., 'logo.png')

    Returns:
        Public URL of the uploaded logo, or None if upload failed
    """
    import logging

    logger = logging.getLogger(__name__)

    client = get_r2_client()
    if client is None:
        logger.error(
            f"R2 client is None - cannot upload logo for institution {institution_id}"
        )
        return None

    object_key = f"institution_logos/{institution_id}/{filename}"

    content_type = "image/png"
    if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
        content_type = "image/jpeg"
    elif filename.lower().endswith(".svg"):
        content_type = "image/svg+xml"
    elif filename.lower().endswith(".gif"):
        content_type = "image/gif"

    logger.info(f"Uploading logo to R2: {object_key} (content_type: {content_type})")
    result = client.upload_image(file_content, object_key, content_type)

    if result:
        logger.info(f"Logo uploaded successfully to R2: {result}")
    else:
        logger.error(
            f"Logo upload to R2 FAILED for institution {institution_id}, file: {filename}"
        )

    return result


def get_institution_logo_r2_url(institution_id: int, filename: str) -> Optional[str]:
    """
    Build the R2 URL for an institution logo.

    Args:
        institution_id: InstitutionSettings ID
        filename: Logo filename

    Returns:
        R2 URL for the logo, or None if R2 is not configured
    """
    client = get_r2_client()
    if client is None:
        return None

    object_key = f"institution_logos/{institution_id}/{filename}"
    return client.get_public_url(object_key)


def upload_doctor_signature(
    file_content: bytes, doctor_id: int, filename: str
) -> Optional[str]:
    """
    Upload a doctor signature image to R2 with proper path structure.
    Signatures are stored permanently in R2 to persist across deployments.

    Args:
        file_content: Raw bytes of the image
        doctor_id: DoctorOperator ID
        filename: Original filename (e.g., 'signature.png')

    Returns:
        Public URL of the uploaded signature, or None if upload failed
    """
    import logging

    logger = logging.getLogger(__name__)

    client = get_r2_client()
    if client is None:
        logger.error(
            f"R2 client is None - cannot upload signature for doctor {doctor_id}"
        )
        return None

    object_key = f"doctor_signatures/{doctor_id}/{filename}"

    content_type = "image/png"
    if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
        content_type = "image/jpeg"
    elif filename.lower().endswith(".webp"):
        content_type = "image/webp"
    elif filename.lower().endswith(".gif"):
        content_type = "image/gif"

    logger.info(
        f"Uploading doctor signature to R2: {object_key} (content_type: {content_type})"
    )
    result = client.upload_image(file_content, object_key, content_type)

    if result:
        logger.info(f"Doctor signature uploaded successfully to R2: {result}")
    else:
        logger.error(
            f"Signature upload to R2 FAILED for doctor {doctor_id}, file: {filename}"
        )

    return result


def get_doctor_signature_r2_url(doctor_id: int, filename: str) -> Optional[str]:
    """
    Build the R2 URL for a doctor signature.

    Args:
        doctor_id: DoctorOperator ID
        filename: Signature filename

    Returns:
        R2 URL for the signature, or None if R2 is not configured
    """
    client = get_r2_client()
    if client is None:
        return None

    object_key = f"doctor_signatures/{doctor_id}/{filename}"
    return client.get_public_url(object_key)
