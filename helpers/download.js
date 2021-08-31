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
    !filename && ( filename = Math.random().toString(16).substr(2) )
    const response = await request
    const writeStream = fs.createWriteStream(path.join(__dirname, '../downloads', filename))
    response.data.pipe(writeStream)
    return finished(writeStream)
}

module.exports = axios_file_download