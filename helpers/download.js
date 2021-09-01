const axios = require('axios').default
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const stream = require('stream');

const finished = promisify(stream.finished);

async function axios_file_download(config, filename){
    if(!fs.existsSync('../downloads'))
        fs.mkdirSync('../downloads')
    const request = axios({
        ...config, 
        responseType: 'stream',
    })
    const response = await request
    !filename && ( fileName = response.headers["content-disposition"].split("filename=")[1])
    
    const writeStream = fs.createWriteStream(path.join(__dirname, '../downloads', filename))
    response.data.pipe(writeStream)
    await finished(writeStream)
    return filename
}

module.exports = axios_file_download