const kaomoji = ['(OwO)', '(UwU)', '>w<', '*nuzzles*', '(*^.^*)', '(^.^)', 'owo', 'uwu', '*blushes*'];

function uwu(text) {
  let result = text;
  // Replace th with d (case-preserving)
  result = result.replace(/[Tt][Hh]/g, (match) => match[0] === 'T' ? 'D' : 'd');
  // Replace r and l with w (case-preserving)
  result = result.replace(/[RrLl]/g, (match) => {
    if (match === 'R' || match === 'L') return 'W';
    return 'w';
  });
  // Add ~ to end of sentences
  result = result.replace(/([.!?])/g, '~$1');
  // Randomly insert kaomoji (after punctuation or at end)
  const sentences = result.split(/(?<=[.!?~])\s+/);
  result = sentences.map((s) => {
    if (Math.random() < 0.4) {
      return s + ' ' + kaomoji[Math.floor(Math.random() * kaomoji.length)];
    }
    return s;
  }).join(' ');
  // Add a kaomoji at the end if none was added
  if (!kaomoji.some(k => result.includes(k))) {
    result += ' ' + kaomoji[Math.floor(Math.random() * kaomoji.length)];
  }
  return result;
}

function sarcasm(text) {
  let upper = false;
  return text.split('').map((char) => {
    if (/[a-zA-Z]/.test(char)) {
      const result = upper ? char.toUpperCase() : char.toLowerCase();
      upper = !upper;
      return result;
    }
    return char;
  }).join('');
}

const pirateReplacements = [
  [/\bhello\b/gi, 'ahoy'],
  [/\bhi\b/gi, 'ahoy'],
  [/\bfriends\b/gi, 'mateys'],
  [/\bfriend\b/gi, 'matey'],
  [/\byour\b/gi, 'yer'],
  [/\byou\b/gi, 'ye'],
  [/\bmy\b/gi, 'me'],
  [/\bis\b/gi, 'be'],
  [/\bare\b/gi, 'be'],
  [/\bthe\b/gi, "th'"],
  [/\byes\b/gi, 'aye'],
  [/\bno\b/gi, 'nay'],
  [/\bmoney\b/gi, 'doubloons'],
  [/\bcoins\b/gi, 'doubloons'],
  [/\bstupid\b/gi, 'scurvy'],
];

function pirate(text) {
  let result = 'Arrr! ' + text;
  for (const [pattern, replacement] of pirateReplacements) {
    result = result.replace(pattern, replacement);
  }
  // Replace "ing" endings with "in'"
  result = result.replace(/ing\b/g, "in'");
  // Randomly add "ye scallywag!" at the end
  if (Math.random() < 0.5) {
    result += ', ye scallywag!';
  }
  return result;
}

const shakespeareReplacements = [
  [/\byour\b/gi, 'thy'],
  [/\byours\b/gi, 'thine'],
  [/\byou\b/gi, 'thou'],
  [/\bare\b/gi, 'art'],
  [/\bis\b/gi, "'tis"],
  [/\bhave\b/gi, 'hath'],
  [/\bdo\b/gi, 'doth'],
  [/\bwill\b/gi, 'shall'],
  [/\bit\b/gi, "'twas"],
  [/\bvery\b/gi, 'most'],
];

const shakespeareInserts = ['forsooth', 'prithee', 'hark', 'methinks'];

function shakespeare(text) {
  let result = text;
  for (const [pattern, replacement] of shakespeareReplacements) {
    result = result.replace(pattern, replacement);
  }
  // Randomly insert Shakespeare-isms
  const words = result.split(' ');
  const insertions = [];
  for (let i = 0; i < words.length; i++) {
    if (Math.random() < 0.15 && i > 0) {
      const insert = shakespeareInserts[Math.floor(Math.random() * shakespeareInserts.length)];
      insertions.push(i);
      words.splice(i, 0, insert + ',');
      i++; // skip past the inserted word
    }
  }
  return words.join(' ');
}

const babyReplacements = [
  [/\bbecause\b/gi, 'cuz'],
  [/\bplease\b/gi, 'pwease'],
  [/\bwant\b/gi, 'wan'],
  [/\blove\b/gi, 'wuv'],
  [/\blittle\b/gi, 'wittle'],
  [/\bsorry\b/gi, 'sowwy'],
  [/\breally\b/gi, 'weally'],
  [/\bwater\b/gi, 'wawa'],
];

const babySounds = ['goo goo', 'ga ga', 'waah', 'googoo', '*giggles*', 'mama'];

function baby(text) {
  let result = text;
  for (const [pattern, replacement] of babyReplacements) {
    result = result.replace(pattern, replacement);
  }
  // Replace r and l with w
  result = result.replace(/[rl]/g, 'w');
  result = result.replace(/[RL]/g, 'W');
  // Double some vowels
  result = result.replace(/([aeiou])/gi, (match) => {
    if (Math.random() < 0.3) return match + match;
    return match;
  });
  // Add baby sounds
  if (Math.random() < 0.5) {
    const sound = babySounds[Math.floor(Math.random() * babySounds.length)];
    result += ' ' + sound;
  }
  return result;
}

const fancyReplacements = [
  [/\bgood\b/gi, 'exquisite'],
  [/\bbad\b/gi, 'dreadful'],
  [/\bbig\b/gi, 'gargantuan'],
  [/\bsmall\b/gi, 'diminutive'],
  [/\bsaid\b/gi, 'proclaimed'],
  [/\bvery\b/gi, 'exceedingly'],
  [/\blike\b/gi, 'am particularly fond of'],
  [/\bhappy\b/gi, 'absolutely delighted'],
  [/\bsad\b/gi, 'utterly despondent'],
  [/\bnice\b/gi, 'simply magnificent'],
];

function fancy(text) {
  let result = text;
  for (const [pattern, replacement] of fancyReplacements) {
    result = result.replace(pattern, replacement);
  }
  return 'Indubitably, ' + result + ' Good day!';
}

function yoda(text) {
  // Split on sentence-ending punctuation, keeping the delimiter
  const sentences = text.split(/([.!?,]+\s*)/);
  const transformed = [];

  for (let i = 0; i < sentences.length; i++) {
    const segment = sentences[i].trim();
    if (!segment) continue;
    // If this is just punctuation, append to previous
    if (/^[.!?,]+$/.test(segment)) {
      if (transformed.length > 0) {
        transformed[transformed.length - 1] += segment;
      }
      continue;
    }

    const words = segment.split(/\s+/);
    if (words.length >= 4) {
      // Move last 2-3 words to front
      const moveCount = words.length >= 6 ? 3 : 2;
      const moved = words.splice(words.length - moveCount, moveCount);
      // Capitalize first moved word, lowercase original first word
      moved[0] = moved[0].charAt(0).toUpperCase() + moved[0].slice(1);
      words[0] = words[0].charAt(0).toLowerCase() + words[0].slice(1);
      transformed.push(moved.join(' ') + ', ' + words.join(' '));
    } else {
      transformed.push(segment);
    }
  }

  return transformed.join(' ');
}

const transformers = {
  uwu,
  sarcasm,
  pirate,
  shakespeare,
  baby,
  fancy,
  yoda,
};

function getStyles() {
  return Object.keys(transformers);
}

module.exports = { ...transformers, getStyles };
