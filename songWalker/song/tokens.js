const Prism = require("prismjs");
const variables = require("./variables");
// Prism.languages.javascript.constant = /\b[a-zA-Z](?:[a-zA-Z_]|\dx?)*\b/

const ROOT_TRACK = 'rootTrack'
const LANGUAGE = {
    'track-start': {
        pattern: /\[[^\]]+]/m,
        lookbehind: true,
        alias: 'selector',
        inside: {
            name: /[^\[\]]+/,
            punctuation: /[\[\]]/
        }
    },
    'play-track-statement': {
        pattern: /@\w+/,
        inside: {
            identifier: /^@/,
            name: /\w+/
        }
    },
    // 'import': {
    //     pattern: /import\s+(\w+)\s+from\s+(['"][\w.\/]+['"]);?/,
    //     inside: Prism.languages.javascript
    // },
    'function-statement': {
        pattern: /\b([\w.]+[ \t]*=[ \t]*)?\w+\([^)]*\)[ \t]*;?/,
        inside: {
            "assign-to-variable": /^[\w.]+(?=[ \t]*=[ \t]*)/,
            'function-name': /\b\w+(?=\()/,
            'param-key': {
                pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
                lookbehind: true
            },
            'param-string': {
                pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
                greedy: true
            },
            'param-variable': /\b[a-zA-Z_]\w*\b/,
            'param-numeric': /\d*[\/.]?\d{1,2}([BTDt])?/,
            'operator': /=/,
            'punctuation': /[{}[\];(),.:]/
        }
    },
    'variable-statement': {
        pattern: /[\w.]+[ \t]*=[ \t]*([\w'./])+[ \t]*;?/,
        inside: {
            "assign-to-variable": /^[\w.]+(?=[ \t]*=[ \t]*)/,
            // "javascript-statement": {
            //     pattern: /[\w'.]+/,
            //     inside: {
            'param-string': {
                pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
                greedy: true
            },

            'param-variable': /\b[a-zA-Z_]\w*\b/,
            'param-numeric': /\d*[\/.]?\d{1,2}([BTDt])?/,
            // 'param-numeric': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
            // 'punctuation': /[={}[\];(),.:]/
            //     }
            // },
            'operator': /=/,
            punctuation: /;/
        }
    },
    'play-statement': {
        pattern: /([A-G][#qb]{0,2}\d)(:[^:;\s]*)*;?/,
        inside: {
            'play-frequency': /[A-G][#qb]{0,2}\d/,
            arg: {
                pattern: /:[^:;\s]+/,
                inside: {
                    'param-numeric': /\d*[\/.]?\d{1,2}([BTDt])?/,
                    'param-string': /[^:;]+/,
                    delimiter: /:/
                },
            },
            punctuation: /;/
        },
    },
    'wait-statement': {
        pattern: /((\d[\/.])?\d{1,2})([BTDt])?;?/,
        inside: {
            numeric: /\d*[\/.]?\d+/,
            factor: /[BTDt]/,
            punctuation: /;/
            // punctuation: /;/
        }
    },
    punctuation: /;/
    // 'newline': REGEXP_NEWLINE,
    // 'play-statement': REGEXP_PLAY_STATEMENT,
}


function sourceToTokens(source) {
    return Prism.tokenize(source, LANGUAGE);
}


function findTokenByType(tokenList, tokenType) {
    if (!(tokenType instanceof RegExp))
        tokenType = new RegExp('^' + tokenType + '$');
    return walkTokens(tokenList, token => {
        if (typeof token !== "string" && tokenType.test(token.type)) {
            return token;
        }
    })
}

function findTokensByType(tokenList, tokenType) {
    if (!(tokenType instanceof RegExp))
        tokenType = new RegExp('^' + tokenType + '$');
    const foundTokenList = [];
    walkTokens(tokenList, token => {
        if (typeof token !== "string" && tokenType.test(token.type)) {
            foundTokenList.push(token);
        }
    })
    return foundTokenList;
}


function walkTokens(tokenList, callback) {
    let returnValue;
    for (const token of tokenList) {
        returnValue = callback(token)
        if (returnValue)
            return returnValue;
        if (Array.isArray(token.content)) {
            returnValue = walkTokens(token.content, callback)
            if (returnValue)
                return returnValue;
        }
    }
    return false;
}

module.exports = {
    sourceToTokens,
    findTokenByType,
    findTokensByType,
    walkTokens,
    ROOT_TRACK,
    LANGUAGE,
}