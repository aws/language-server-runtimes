import { Readable } from "stream"
import assert from 'assert'
import { EncryptionInitialization, readEncryptionDetails, shouldWaitForEncryptionKey, validateEncryptionDetails } from "./encryption"
import sinon from "sinon";

function createReadableStream(): Readable{
    const stream = new Readable()
    // throws error if not implemented
    stream._read = function() { }
    return stream
}

describe("readEncryptionDetails", () => {
    it("resolves with the parsed encryption details", async () => {
        const request: EncryptionInitialization = {
            version: '1.0',
            mode: 'JWT',
            key: 'encryption_key'
        }       

        const stream = createReadableStream()
        stream.push(JSON.stringify(request))
        stream.push('\n')    

        const result = await readEncryptionDetails(stream)
        assert.deepEqual(result, request)
        })

    it('rejects if no newline is encountered within the timeout', async () => {
        const clock = sinon.useFakeTimers()
        const stream = createReadableStream()
        const timeoutMs = 5000
    
        await assert.rejects(
            async () => {
              const promise = readEncryptionDetails(stream);
              clock.tick(timeoutMs)
              await promise
            },
            /Encryption details followed by newline must be sent during first/
          );
      
          clock.restore()
    })
  
    it('rejects if bad JSON is sent', async () => {
        const stream = createReadableStream()
        
        stream.push('badJSON')
        stream.push('\n')
    
        await assert.rejects(readEncryptionDetails(stream), /not valid JSON/)
    })
})

describe('validateEncryptionDetails', () => {
    it('does not throw for valid encryption details', () => {
      const validEncryptionDetails: EncryptionInitialization = {
        version: '1.0',
        key: 'secret_key',
        mode: 'JWT',
      };
  
      assert.doesNotThrow(() => validateEncryptionDetails(validEncryptionDetails));
    });
  
    it('throws for unsupported initialization version', () => {
      const invalidVersionEncryptionDetails: EncryptionInitialization = {
        version: '2.0', // Unsupported version
        key: 'secret_key',
        mode: 'JWT',
      };
  
      assert.throws(
        () => validateEncryptionDetails(invalidVersionEncryptionDetails),
        /Unsupported initialization version: 2.0/
      );
    });
  
    it('throws for missing encryption key', () => {
      const missingKeyEncryptionDetails = {
        version: '1.0',
        // Missing key
        mode: 'JWT',
      };
  
      assert.throws(
        () => validateEncryptionDetails(missingKeyEncryptionDetails as EncryptionInitialization),
        /Encryption key is missing/
      );
    });
  
    it('throws for unsupported encoding mode', () => {
      const invalidModeEncryptionDetails = {
        version: '1.0',
        key: 'secret_key',
        mode: 'AES', // Unsupported mode
      };
  
      assert.throws(
        () => validateEncryptionDetails(invalidModeEncryptionDetails as EncryptionInitialization),
        /Unsupported encoding mode: AES/
      );
    });
});

describe('shouldWaitForEncryptionKey', () => {
    it('should return true when --set-credentials-encryption-key is in process.argv', () => {
        const originalArgv = process.argv;
        process.argv = ['--set-credentials-encryption-key'];

        assert.strictEqual(shouldWaitForEncryptionKey(), true);

        process.argv = originalArgv;
    });

    it('should return false when --set-credentials-encryption-key is not in process.argv', () => {
        const originalArgv = process.argv;
        process.argv = ['--some-other-arg'];

        assert.strictEqual(shouldWaitForEncryptionKey(), false);

        process.argv = originalArgv;
    });
});