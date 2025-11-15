"""
S3 uploader utility for uploading slide images to AWS S3.
"""
import os
from pathlib import Path
from typing import List, Optional
import boto3
from botocore.exceptions import ClientError


class S3Uploader:
    """Handles uploading files to AWS S3."""

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        region_name: Optional[str] = None
    ):
        """
        Initialize S3 uploader.

        Args:
            bucket_name: S3 bucket name (defaults to AWS_S3_BUCKET env var)
            aws_access_key_id: AWS access key (defaults to AWS_ACCESS_KEY_ID env var)
            aws_secret_access_key: AWS secret key (defaults to AWS_SECRET_ACCESS_KEY env var)
            region_name: AWS region (defaults to AWS_REGION env var or 'us-east-1')
        """
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET")

        if not self.bucket_name:
            raise ValueError(
                "S3 bucket name must be provided either as argument or via AWS_S3_BUCKET env var"
            )

        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id or os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=aws_secret_access_key or os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=region_name or os.getenv("AWS_REGION", "us-east-1")
        )

    def upload_file(
        self,
        file_path: Path,
        s3_key: str,
        content_type: str = "image/png",
        make_public: bool = True
    ) -> str:
        """
        Upload a single file to S3.

        Args:
            file_path: Path to the local file
            s3_key: S3 object key (path in bucket)
            content_type: MIME type of the file
            make_public: Not used anymore (kept for backward compatibility)
                         Use bucket policy for public access instead

        Returns:
            Public URL of the uploaded file

        Raises:
            ClientError: If upload fails
        """
        extra_args = {
            'ContentType': content_type
        }

        # Don't use ACL - modern S3 buckets have ACLs disabled by default
        # Instead, configure bucket policy or use CloudFront for public access

        try:
            self.s3_client.upload_file(
                str(file_path),
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )

            # Generate public URL
            region = self.s3_client.meta.region_name
            if region == 'us-east-1':
                url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            else:
                url = f"https://{self.bucket_name}.s3.{region}.amazonaws.com/{s3_key}"

            return url

        except ClientError as e:
            error_msg = str(e)
            raise RuntimeError(
                f"Failed to upload {file_path.name} to {self.bucket_name}/{s3_key}: {error_msg}"
            ) from e

    def upload_files(
        self,
        file_paths: List[Path],
        s3_prefix: str = "slides",
        make_public: bool = True
    ) -> List[str]:
        """
        Upload multiple files to S3.

        Args:
            file_paths: List of paths to local files
            s3_prefix: Prefix (folder) in S3 bucket
            make_public: Whether to make files publicly readable

        Returns:
            List of public URLs for uploaded files

        Raises:
            RuntimeError: If any upload fails
        """
        urls = []

        for file_path in file_paths:
            s3_key = f"{s3_prefix}/{file_path.name}"
            url = self.upload_file(
                file_path,
                s3_key,
                content_type="image/png",
                make_public=make_public
            )
            urls.append(url)

        return urls

    def clear_prefix(self, s3_prefix: str = "slides"):
        """
        Delete all objects under a specific prefix in S3.
        Handles pagination to delete large numbers of objects.

        Args:
            s3_prefix: Prefix (folder) to clear
        """
        try:
            # List and delete all objects with pagination support
            continuation_token = None
            total_deleted = 0

            while True:
                # List objects with the prefix
                list_params = {
                    'Bucket': self.bucket_name,
                    'Prefix': s3_prefix
                }

                if continuation_token:
                    list_params['ContinuationToken'] = continuation_token

                response = self.s3_client.list_objects_v2(**list_params)

                # Delete objects if any exist
                if 'Contents' in response:
                    objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]

                    if objects_to_delete:
                        delete_response = self.s3_client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': objects_to_delete}
                        )

                        deleted_count = len(delete_response.get('Deleted', []))
                        total_deleted += deleted_count
                        print(f"Deleted {deleted_count} objects from S3 prefix '{s3_prefix}'")

                # Check if there are more objects to list
                if response.get('IsTruncated'):
                    continuation_token = response.get('NextContinuationToken')
                else:
                    break

            if total_deleted > 0:
                print(f"Total: Cleared {total_deleted} objects from S3 prefix '{s3_prefix}'")
            else:
                print(f"No objects found in S3 prefix '{s3_prefix}'")

        except ClientError as e:
            print(f"Warning: Failed to clear S3 prefix {s3_prefix}: {str(e)}")
