import {expect, test} from '@jest/globals'
import {properEncodeURI, properEncodeURIComponent} from '../src/proper-encode-uri';

test('Test properEncodeURI', () => {
    expect(properEncodeURI('https://www.example.com/')).toBe('https://www.example.com/');
    expect(properEncodeURI('https://www.example.com/foo/bar')).toBe('https://www.example.com/foo/bar');
    expect(properEncodeURI('https://www.example.com?foo=bar')).toBe('https://www.example.com?foo=bar');
    expect(properEncodeURI('https://www.example.com#foobar')).toBe('https://www.example.com#foobar');
    expect(properEncodeURI('https://www.example.com')).toBe('https://www.example.com');
    expect(properEncodeURI('https://www.example.com:8080')).toBe('https://www.example.com:8080');
    expect(properEncodeURI('https://www.example.com:8080/foo/bar')).toBe('https://www.example.com:8080/foo/bar');

    expect(properEncodeURI('https://www.example.com/AZaz09;,/?:@&=+$-_.!~*\'()#')).toBe('https://www.example.com/AZaz09;,/?:@&=+$-_.!~*\'()#');
    expect(properEncodeURI('https://www.example.com/azAZäöüÄÖÜß')).toBe('https://www.example.com/azAZ%C3%A4%C3%B6%C3%BC%C3%84%C3%96%C3%9C%C3%9F');
});

test('Test properEncodeURI (multi byte characters)', () => {
    // 1 byte (carriage return)
    expect(properEncodeURI('\u000D')).toBe('%0D'); // ES5 Unicode escape sequence
    expect(properEncodeURI('\u{000D}')).toBe('%0D'); // ES6 Unicode escape sequence
    expect(properEncodeURI('\r')).toBe('%0D');

    // 2 byte (copyright sign)
    expect(properEncodeURI('\u00A9')).toBe('%C2%A9'); // ES5 Unicode escape sequence
    expect(properEncodeURI('\u{00A9}')).toBe('%C2%A9'); // ES6 Unicode escape sequence
    expect(properEncodeURI('©')).toBe('%C2%A9');

    // 3 byte (black circle with down arrow)
    expect(properEncodeURI('\u29ED')).toBe('%E2%A7%AD'); // ES5 Unicode escape sequence
    expect(properEncodeURI('\u{29ED}')).toBe('%E2%A7%AD'); // ES6 Unicode escape sequence
    expect(properEncodeURI('⧭')).toBe('%E2%A7%AD');

    // 4 byte (pile of poo)
    expect(properEncodeURI('\uD83D\uDCA9')).toBe('%F0%9F%92%A9'); // ES5 Unicode escape sequence (surrogate pair)
    expect(properEncodeURI('\u{1F4A9}')).toBe('%F0%9F%92%A9'); // ES6 Unicode escape sequence
    expect(properEncodeURI('💩')).toBe('%F0%9F%92%A9');
});

test('Test properEncodeURI (character exceptions)', () => {
    testAgainstAllUnicodeCharacters(
        [
            // Reserved (gen-delims)
            /:/,
            /\//,
            /\?/,
            /#/,
            /\[/,
            /]/,
            /@/,

            // Reserved (sub-delims)
            /!/,
            /\$/,
            /&/,
            /'/,
            /\(/,
            /\)/,
            /\*/,
            /\+/,
            /,/,
            /;/,
            /=/,

            // Unreserved
            /[a-zA-Z]/,
            /[0-9]/,
            /-/,
            /\./,
            /_/,
            /~/
        ],
        unicodeCharacter => expect(properEncodeURI(unicodeCharacter)).not.toBe(unicodeCharacter),
        unicodeCharacter => expect(properEncodeURI(unicodeCharacter)).toBe(unicodeCharacter)
    );
});

test('Test properEncodeURIComponent', () => {
    expect(properEncodeURIComponent('AZaz09-_.!~*\'()')).toBe('AZaz09-_.!~*\'()');
    expect(properEncodeURIComponent('azAZäöüÄÖÜß;,/?:@&=+$#')).toBe('azAZ%C3%A4%C3%B6%C3%BC%C3%84%C3%96%C3%9C%C3%9F%3B%2C%2F%3F%3A%40%26%3D%2B%24%23');
});

test('Test properEncodeURIComponent (multi byte characters)', () => {
    // 1 byte (carriage return)
    expect(properEncodeURIComponent('\u000D')).toBe('%0D'); // ES5 Unicode escape sequence
    expect(properEncodeURIComponent('\u{000D}')).toBe('%0D'); // ES6 Unicode escape sequence
    expect(properEncodeURIComponent('\r')).toBe('%0D');

    // 2 byte (copyright sign)
    expect(properEncodeURIComponent('\u00A9')).toBe('%C2%A9'); // ES5 Unicode escape sequence
    expect(properEncodeURIComponent('\u{00A9}')).toBe('%C2%A9'); // ES6 Unicode escape sequence
    expect(properEncodeURIComponent('©')).toBe('%C2%A9');

    // 3 byte (black circle with down arrow)
    expect(properEncodeURIComponent('\u29ED')).toBe('%E2%A7%AD'); // ES5 Unicode escape sequence
    expect(properEncodeURIComponent('\u{29ED}')).toBe('%E2%A7%AD'); // ES6 Unicode escape sequence
    expect(properEncodeURIComponent('⧭')).toBe('%E2%A7%AD');

    // 4 byte (pile of poo)
    expect(properEncodeURIComponent('\uD83D\uDCA9')).toBe('%F0%9F%92%A9'); // ES5 Unicode escape sequence (surrogate pair)
    expect(properEncodeURIComponent('\u{1F4A9}')).toBe('%F0%9F%92%A9'); // ES6 Unicode escape sequence
    expect(properEncodeURIComponent('💩')).toBe('%F0%9F%92%A9');
});

test('Test properEncodeURIComponent (reserved characters should not be encoded but stay the same)', () => {
    testAgainstAllUnicodeCharacters(
        [
            // Reserved (sub-delims)
            /!/,
            /'/,
            /\(/,
            /\)/,
            /\*/,

            // Unreserved
            /[a-zA-Z]/,
            /[0-9]/,
            /-/,
            /\./,
            /_/,
            /~/
        ],
        unicodeCharacter => expect(properEncodeURIComponent(unicodeCharacter)).not.toBe(unicodeCharacter),
        unicodeCharacter => expect(properEncodeURIComponent(unicodeCharacter)).toBe(unicodeCharacter)
    );
});

/**
 * Test all Unicode characters against the given handlers. If the characters is included in reservedCharacters the
 * exceptionHandler is used, otherwise the defaultHandler.
 *
 * @param {RegExp[]} reservedCharacters
 * @param {function} defaultHandler
 * @param {function} exceptionHandler
 */
async function testAgainstAllUnicodeCharacters(reservedCharacters, defaultHandler, exceptionHandler) {
    const checkUnicodeRange = (from, to) => {
        return new Promise((resolve) => {
            for (let i = from; i < to; i++) {
                const unicodeCharacter = String.fromCharCode(i);

                // Check for exceptions
                let isException = false;
                for (let j = 0, n = reservedCharacters.length; j < n; j++) {
                    if (reservedCharacters[j].test(unicodeCharacter)) {
                        isException = true;
                        break;
                    }
                }

                // Call handler
                if (isException) {
                    exceptionHandler(unicodeCharacter);
                } else {
                    defaultHandler(unicodeCharacter);
                }
            }

            // Resolve promise
            resolve();
        });
    };

    // The planes are based on the current Unicode 13.0 definition
    // We test from the lowest to the highest used block, even if that includes undefined blocks.
    await Promise.all([
        // Basic Multilingual Plane (Plane 0)
        checkUnicodeRange(0x0000, 0xFFFF),

        // Supplementary Multilingual Plane (Plane 1)
        checkUnicodeRange(0x10000, 0x1FBFF),

        // Supplementary Ideographic Plane (Plane 2)
        checkUnicodeRange(0x20000, 0x2FA1F),

        // Tertiary Ideographic Plane (Plane 3)
        checkUnicodeRange(0x30000, 0x3134F),

        // Supplementary Special-purpose Plane (Plane 14)
        checkUnicodeRange(0xE0000, 0xE01EF),

        // Supplementary Private Use Area-A (Plane 15)
        checkUnicodeRange(0xF0000, 0xFFFFF),

        // Supplementary Private Use Area-B (Plane 16)
        checkUnicodeRange(0x100000, 0x10FFFF),
    ]);
}
