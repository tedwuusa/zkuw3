const chai = require("chai");
const chaiAsPromised = require('chai-as-promised')

const assert = chai.assert;
const expect = chai.expect;
chai.use(chaiAsPromised);

const buildPoseidon = require("circomlibjs").buildPoseidon;
const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("Mastermind Variation Test", function () {
    this.timeout(100000000);
    let circuit;

    before(async () => {
        circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

    });

    it("Should return all hits", async () => {
        const INPUT = {
            "guess": ["1","3","5","2","4","6"],
            "solution": ["1","3","5","2","4","6"],
            "salt": "1234",
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(6))); // 6 hits
        assert(Fr.eq(Fr.e(witness[2]), Fr.e(0))); // 0 blows
    });

    it("Should return 2 hits and 2 blows", async () => {
        const INPUT = {
            "guess":    ["2","3","7","8","4","5"],
            "solution": ["1","3","5","2","4","6"],
            "salt": "5678",
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(2))); // 2 hits
        assert(Fr.eq(Fr.e(witness[2]), Fr.e(2))); // 2 blows
    });

    it("Should match hash", async () => {
        const INPUT = {
            "guess":    ["2","3","7","8","4","5"],
            "solution": ["1","3","5","2","4","6"],
            "salt": "1314",
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        poseidon = await buildPoseidon();
        const hashArray = poseidon([1,3,5,2,4,6,1314]);
        const hash = poseidon.F.toObject(hashArray); 

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[3]), hash));
    });

    it("Should fail with duplicate input element", async () => {
        const INPUT = {
            "guess":    ["2","3","7","8","4","4"], // Duplicated input
            "solution": ["1","3","5","2","4","6"],
            "salt": "5678",
        }

        expect(circuit.calculateWitness(INPUT, true)).to.eventually.be.rejected;
    });

    it("Should fail when input too long", async () => {
        const INPUT = {
            "guess":    ["2","3","7","8","4","5","6"], // Extra element
            "solution": ["1","3","5","2","4","6"],
            "salt": "5678",
        }

        expect(circuit.calculateWitness(INPUT, true)).to.eventually.be.rejected;
    });

    it("Should fail when input out of range", async () => {
        const INPUT = {
            "guess":    ["2","3","7","8","4","11"], // Invalid input option
            "solution": ["1","3","5","2","4","6"],
            "salt": "5678",
        }

        expect(circuit.calculateWitness(INPUT, true)).to.eventually.be.rejected;
    });
});