const AWS = require('aws-sdk');
const S3 = new AWS.S3({apiVersion: '2006-03-01', region: 'sa-east-1'})
const textract = new AWS.Textract({apiVersion: '2018-06-27', region: 'us-east-1'})

const FormatBytes = require('../common/formatBytes')

const bucketName = "atlantico-digital"

const createFolder = async (path) => {

    const params = {
        Bucket: bucketName,
        Key: path,
        Body: '',
        ACL: 'public-read'
    }

    return S3.putObject(params).promise()
        .then(data => {

            return true
            
        })
        .catch(err => {
            return false
        })

}

const deleteObject = async (path) => {

    const params = {
        Bucket: bucketName,
        Key: path,
    }

    return S3.deleteObject(params).promise()
        .then(data => {

            return true
            
        })
        .catch(err => {
            return false
        })

}

const exists = async (path) => {

    const params = {
        Bucket: bucketName,
        Delimiter: '/',
        Prefix: path.toString()
    }

    return S3.listObjectsV2(params).promise()
        .then(async data => {

            if(!data.KeyCount){
                await createFolder(`${path}/uploads/`)
                await createFolder(`${path}/documents/`)
            }
            
            return true
        })
        .catch(err => {
            return false
        })

}

const list = async (path) => {

    const params = {
        Bucket: bucketName,
        Delimiter: '/',
        Prefix: path,
        MaxKeys: 1000
    }

    return S3.listObjectsV2(params).promise()
        .then(data => {
            return {
                folders: data.CommonPrefixes.map(item => { return item.Prefix }),
                files: data.Contents.filter(item => {
                    // return item

                    if(item.Size){
                        return item
                    }

                }).map(item => {
                    const array = item.Key.split("/")

                    const lastModified = new Date(item.LastModified)
                    const date = lastModified.getDate().toString()
                    const month = (lastModified.getMonth()+1).toString()

                    return {
                        path: item.Key,
                        lastModified: item.LastModified,
                        lastModifiedFormated: `${date.padStart(2, '0')}/${month.padStart(2, '0')}/${lastModified.getFullYear()} ${lastModified.getHours()}:${lastModified.getMinutes()}`,
                        name: array[array.length -1],
                        size: FormatBytes(item.Size)
                    }
                })
            }
        })
        .catch(err => {
            return false
        })

}

const upload = async (path,base64data) => {

    const params = {
        Bucket: bucketName,
        Key: `${path}`,
        Body: base64data,
        ContentEncoding: 'base64',
        ACL: 'public-read'
    }

    return S3.putObject(params).promise()
        .then(data => {
            console.log(params)
            return true
            
        })
        .catch(err => {
            return false
        })

}

const getDocumentTextDetection = async (JobId) => {

    const params = {
        JobId
    };

    const promise = new Promise(async (resolve, reject) => {

        textract.getDocumentTextDetection(params, function(err, data){
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(new Error("error!"));
            } else {
                resolve(data);
            } 
        })
        
    })

    return promise

}

const startDocumentTextDetection = async (id,tag) => {

    const params = {
        DocumentLocation: { /* required */
          S3Object: {
            Bucket: "amplify-atlanticodigitalapp-atlantico-152552-deployment",
            Name: "700_recibosustentoministerial_012021_jordana_leticia_maicon.pdf"
          }
        },
        ClientRequestToken: id,
        JobTag: tag,
        NotificationChannel: {
          RoleArn: 'arn:aws:iam::734128143744:role/SNSSuccessFeedback', /* required */
          SNSTopicArn: 'arn:aws:sns:us-east-1:734128143744:Textract' /* required */
        },
        OutputConfig: {
          S3Bucket: "amplify-atlanticodigitalapp-atlantico-152552-deployment", /* required */
        }
    };

    console.log(params)

    return textract.startDocumentTextDetection(params, function(err, data){
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);
    })

}

const signedUrl = async (path, res) => {

    const params = {
        Bucket: bucketName,
        Key: `${path}`,
        Expires: 60 * 5
    }

    const promise = S3.getSignedUrlPromise('getObject',params);

    return promise.then(function(url) {
        return url
      }, function(err) {
        return false
    })

}

module.exports = { list, exists, createFolder, deleteObject, upload, signedUrl, startDocumentTextDetection, getDocumentTextDetection }