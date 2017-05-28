var parser = require('./messagesparser');
const expect = require('chai').expect;

describe('Messages Parser', function() {
    it('correctly encodes a GetCapabilities message', function() {
        var result = parser.EncodeGetCaps();
        var expected = Buffer.from("01040000000605302e302e33", "hex");
        expect(result).to.deep.equal(expected);
    })

    it('correctly encodes a GetSwVer message', function() {
        var result = parser.EncodeGetSwVersion();
        var expected = Buffer.from("44040000000100", "hex");
        expect(result).to.deep.equal(expected);
    })

    it('correctly decodes a SwVer Response', function() {
        var result = parser.Decode(Buffer.from("45040000001d535749443a313234332d31323838535752563a312e302e412e302e3136", "hex"));
        expect(result.length).to.equal(1);
        expect(result[0].version).to.equal("WID:1243-1288SWRV:1.0.A.0.16");
    });

    it('parses a Device Specifications message correctly', function() {
        var result = parser.Decode(Buffer.from("0204000000108080131330301313320005302e302e36", "hex"));
        expect(result.length).to.equal(1);
        expect(result[0].messageId).to.equal(2);
        expect(result[0].width).to.equal(128);
        expect(result[0].height).to.equal(128);
        expect(result[0].softwareVersion).to.equal("0.0.6");
    });

    it('parses a DeviceState off message correctly', function() {
        var result = parser.Decode(Buffer.from("07040000000100", "hex"));
        expect(result.length).to.equal(1);
        expect(result[0].deviceStatus).to.equal(0);
    });

    it('parses a DeviceState on message correctly', function() {
        var result = parser.Decode(Buffer.from("07040000000101", "hex"));
        expect(result.length).to.equal(1);
        expect(result[0].deviceStatus).to.equal(1);
    });

    it('builds multi-byte subarrays that make sense', function() {
        var source = Buffer.from("0123456789ABCDEF", "hex");
        var result_singlebyte = parser.ByteSubst(source, 1, 2);
        expect(result_singlebyte[0]).to.equal(0x23);
        expect(result_singlebyte.length).to.equal(1);

        var result_doublebyte = parser.ByteSubst(source, 1, 3);
        expect(result_doublebyte[1]).to.equal(0x45);
        expect(result_doublebyte.length).to.equal(2);
    });

    it('returns single-bytes from an array', function() {
        var source = Buffer.from("0123456789ABCDEF", "hex");
        var lastByte = parser.GetByte(source, 7);
        expect(lastByte[0]).to.equal(0xEF);
    });

    it('encodes a Time response', function() {
        var response = parser.EncodeGetTimeResponse(Math.floor(new Date().getTime() / 1000), true);
        expect(response).to.equal(['12']);
    });
});
