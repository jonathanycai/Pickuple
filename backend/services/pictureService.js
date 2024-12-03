import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from 'crypto'
import sharp from "sharp";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import loadEnvFile from '../utils/envUtil.js';

const envVariables = loadEnvFile('./.env');

const bucketName = envVariables.BUCKET_NAME   
const bucketRegion = envVariables.BUCKET_REGION
const accessKey = envVariables.ACCESS_KEY
const secretAccessKey = envVariables.SECRET_ACCESS_KEY

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
})

export async function createPicture(connection, file) {
  const imageName = await uploadImageToS3(file);
  const altDescription = file.originalname;

  try {
    const result = await connection.execute(
      `INSERT INTO PICTURE (pictureSrc, altDescription) VALUES (:imageName, :altDescription)`,
      {
        imageName,
        altDescription
      },
    );
    if (result.rowsAffected && result.rowsAffected > 0) {
      return imageName;
    } else {
      throw new Error('Picture was not inserted.');
    }
  } catch (err) {
    console.log(err);
    throw new Error('Failed to insert new tuple into Picture.');
  }
}

export async function getThumbnailUrls(games) {
  for (const game of games) {
    console.log(game);
    if (game[1] != null) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: game[1]
      }
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      game[1] = url;
    }
  }
}

export async function deleteThumbnail(thumbnail) {
  const params = {
    Bucket: bucketName,
    Key: thumbnail,
  }

  const command = new DeleteObjectCommand(params);
  await s3.send(command);
}

async function uploadImageToS3(file) {
  try {
    const imageName = randomImageName();
    const buffer = await sharp(file.buffer).resize(({height: 150, width: 150, fit: 'contain'})).toBuffer()

    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: file.mimetype,
    }
    const command = new PutObjectCommand(params);
    await s3.send(command)

    return imageName;
  } catch (err) {
    console.log(err);
    throw new Error('Error occured while uploading image to S3')
  }
}

export async function deletePicture(connection, pictureSrc) {
  try {
    const result = await connection.execute(
      `DELETE FROM Picture WHERE pictureSrc = :pictureSrc`,
      {
        pictureSrc,
      },
    );   
    if (!(result.rowsAffected && result.rowsAffected > 0)) {
      throw new Error("Picture failed to delete");
    }
    await deleteThumbnail(pictureSrc);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to delete Picture");
  }
}