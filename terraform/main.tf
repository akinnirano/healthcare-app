provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "healthcare-app-frontend"
  acl    = "public-read"
}
