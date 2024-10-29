const wc = require("./witness_calculator.js");
const { readFileSync, writeFile } = require("fs");

async function generateWitness(wasmFilePath, input, outputPath) {
    let inputData;
    if (typeof input === 'string') {
        // If input is a file path, read the JSON file
        inputData = JSON.parse(readFileSync(input, "utf8"));
    } else {
        // If input is already an object, use it directly
        inputData = input;
    }
    
    const buffer = readFileSync(wasmFilePath);
    const witnessCalculator = await wc(buffer);
    const buff = await witnessCalculator.calculateWTNSBin(inputData, 0);
    
    return new Promise((resolve, reject) => {
        if (outputPath) {
            writeFile(outputPath, buff, function(err) {
                if (err) reject(err);
                resolve(buff);
            });
        } else {
            resolve(buff);
        }
    });
}

// Handle CLI usage
if (require.main === module) {
    if (process.argv.length !== 5) {
        console.log("Usage: node generate_witness.js <file.wasm> <input.json> <output.wtns>");
        process.exit(1);
    }
    
    generateWitness(process.argv[2], process.argv[3], process.argv[4])
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = generateWitness;
