const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class DocumentProcessor {
    static async processDocument(filePath, mimeType) {
        let data = [];
        
        try {
            if (mimeType.includes('spreadsheet') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
                data = await this.processExcel(filePath);
            } else if (mimeType.includes('csv') || filePath.endsWith('.csv')) {
                data = await this.processCSV(filePath);
            } else if (mimeType.includes('text') || filePath.endsWith('.txt')) {
                data = await this.processText(filePath);
            } else {
                throw new Error('Unsupported file type');
            }

            return data;
        } catch (error) {
            console.error('Document processing error:', error);
            throw error;
        }
    }

    static async processExcel(filePath) {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        return this.extractParticipants(jsonData);
    }

    static async processCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    resolve(this.extractParticipants(results));
                })
                .on('error', reject);
        });
    }

    static async processText(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Simple text processing - you can enhance this
        const lines = content.split('\n').filter(line => line.trim());
        return [{
            participant: 'Text Document User',
            category: 'General',
            transcript: content
        }];
    }

    static extractParticipants(data) {
        const participants = [];
        
        data.forEach((row, index) => {
            // Handle different column naming conventions
            const participant = row.Participant || row.participant || row.name || row.Name || `User_${index + 1}`;
            const category = row.Category || row.category || row.type || row.Type || 'General';
            const transcript = row.Transcript || row.transcript || row.content || row.Content || '';
            
            if (participant && participant !== 'Participant') {
                participants.push({
                    participant: participant.toString().trim(),
                    category: category.toString().trim(),
                    transcript: transcript.toString().trim(),
                    raw_data: row
                });
            }
        });

        return participants;
    }
}

module.exports = DocumentProcessor;
