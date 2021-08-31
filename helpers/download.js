const axios = require('axios').default
const fs = require('fs')
const path = require('path')

async function axios_file_download(url, filename){
    const axiosStream = axios.get(url, {
        responseType: 'stream',
    })
    const writeStream = fs.createWriteStream(path.join(__dirname, '../database', filename))
    axiosStream.pipe(writeStream)
    return new Promise((resolve, reject) => {
        axiosStream.on('end', () => {
            resolve()
        })
        axiosStream.on('error', (error) => {
            reject(error)
        })
    })
}

module.exports = axios_file_download