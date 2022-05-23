pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template MastermindVariation(colors, holes, allowDup) {
    assert(colors<=26); // support up to 26 colors
    assert(holes<=8); // support up to 8 holes

    // Public inputs
    signal input guess[holes];

    // Private inputs
    signal input solution[holes];
    signal input salt;

    // Output
    signal output hit;
    signal output blow;
    signal output hash;

    // Check guess and solution values are less than the number of colors.
    component guessMax[holes];
    component solutionMax[holes];
    component guessDup[holes*(holes-1)/2];
    component solutionDup[holes*(holes-1)/2];
    var index = 0;
    for (var i=0; i<holes; i++) {
        guessMax[i] = LessThan(5);
        guessMax[i].in[0] <== guess[i];
        guessMax[i].in[1] <== colors;
        guessMax[i].out === 1;
        solutionMax[i] = LessThan(5);
        solutionMax[i].in[0] <== solution[i];
        solutionMax[i].in[1] <== colors;
        solutionMax[i].out === 1;

        // Only check duplicate colors if it is not allowed
        if (allowDup == 0) {
            for (var j=i+1; j<holes; j++) {
                guessDup[index] = IsEqual();
                guessDup[index].in[0] <== guess[i];
                guessDup[index].in[1] <== guess[j];
                guessDup[index].out === 0;
                solutionDup[index] = IsEqual();
                solutionDup[index].in[0] <== solution[i];
                solutionDup[index].in[1] <== solution[j];
                solutionDup[index].out === 0;
                index += 1;
            }
        }
    }

    // Count hit & blow
    var hitCount = 0;
    var blowCount = 0;
    component check[holes**2];
    for (var i=0; i<holes; i++) {
        for (var j=0; j<holes; j++) {
            var index = i*holes+j;
            check[index] = IsEqual();
            check[index].in[0] <== solution[i];
            check[index].in[1] <== guess[j];
            if (i == j) {
                hitCount += check[index].out;
            } else {
                blowCount += check[index].out;
            }
        }
    }
    hit <== hitCount;
    blow <== blowCount;

    // Calculate the hash of the solution
    component poseidon = Poseidon(holes+1);
    for (var i=0; i<holes; i++)
        poseidon.inputs[i] <== solution[i];
    poseidon.inputs[holes] <== salt;
    hash <== poseidon.out;
}

// 1979 Supersonic Electronic Mastermind with 10 colors and 6 holes, duplicate not allowed
component main = MastermindVariation(10, 6, 0);
