'use strict';

var PNG = require('pngjs').PNG,
    fs = require('fs'),
    test = require('tap').test,
    path = require('path'),
    match = require('../.');

diffTest('1a', '1b', '1diff', 0.05, false, 143);
diffTest('2a', '2b', '2diff', 0.05, false, 12439);
diffTest('3a', '3b', '3diff', 0.05, false, 212);
diffTest('4a', '4b', '4diff', 0.05, false, 36089);
diffTest('5a', '5b', '5diff', 0.05, false, 28134);

detectAddsTest('5a', '5b', '5diff-detectAdds', 0.05, true, 30842);

test('throws error if image sizes do not match', function (t) {
    t.throws(function () {
        match([1, 2, 3], [1, 2, 3, 4], null, 2, 1);
    }, /Image sizes do not match/);
    t.doesNotThrow(function () {
        match([1, 2, 3], [1, 2, 3, 4], null, 2, 1, {ignoreSize: true});
    }, /Image sizes do not match/);
    t.end();
});

function diffTest(imgPath1, imgPath2, diffPath, threshold, includeAA, expectedMismatch) {
    var name = 'comparing ' + imgPath1 + ' to ' + imgPath2 +
            ', threshold: ' + threshold + ', includeAA: ' + includeAA;

    test(name, function (t) {
        var img1 = readImage(imgPath1, function () {
            var img2 = readImage(imgPath2, function () {
                var expectedDiff = readImage(diffPath, function () {
                    var diff = new PNG({width: img1.width, height: img1.height});

                    var mismatch = match(img1.data, img2.data, diff.data, diff.width, diff.height, {
                        threshold: threshold,
                        includeAA: includeAA
                    });

                    var mismatch2 = match(img1.data, img2.data, null, diff.width, diff.height, {
                        threshold: threshold,
                        includeAA: includeAA
                    });

                    t.same(diff.data, expectedDiff.data, 'diff image');
                    t.same(mismatch, expectedMismatch, 'number of mismatched pixels');
                    t.same(mismatch, mismatch2, 'number of mismatched pixels');

                    t.end();
                });
            });
        });
    });
}

function detectAddsTest(imgPath1, imgPath2, diffPath, threshold, includeAA, expectedMismatch) {
    var name = 'comparing ' + imgPath1 + ' to ' + imgPath2 +
        ', threshold: ' + threshold + ', includeAA: ' + includeAA;

    test(name, function (t) {
        var img1 = readImage(imgPath1, function () {
            var img2 = readImage(imgPath2, function () {
                var expectedDiff = readImage(diffPath, function () {
                    var diff = new PNG({width: img1.width, height: img1.height}),
                        diffReverse = new PNG({width: img1.width, height: img1.height});

                    var mismatch = match(img1.data, img2.data, diff.data, diff.width, diff.height, {
                        threshold: threshold,
                        includeAA: includeAA,
                        discriminateChanges: true,
                        detailedReturn: true
                    });

                    var mismatch2 = match(img2.data, img1.data, diffReverse.data, diff.width, diff.height, {
                        threshold: threshold,
                        includeAA: includeAA,
                        discriminateChanges: true,
                        detailedReturn: true
                    });

                    t.same(diff.data, expectedDiff.data, 'diff image');
                    t.notSame(diff.data, diffReverse.data, 'reverse diff image - order matters here');
                    t.same(mismatch.total, expectedMismatch, 'number of mismatched pixels');
                    t.same(mismatch.total, mismatch2.total, 'number of mismatched pixels');
                    t.same(mismatch.added, mismatch2.removed, 'number of mismatched pixels');

                    t.end();
                });
            });
        });
    });
}

function readImage(name, done) {
    return fs.createReadStream(path.join(__dirname, '/fixtures/' + name + '.png')).pipe(new PNG()).on('parsed', done);
}
