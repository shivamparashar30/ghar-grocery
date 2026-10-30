/* Devanagari -> latin, so typing "pisa" finds "पीसा".
   Two forms are produced:
     norm  : "peesaa" collapsed to "pisa"
     skel  : consonant skeleton "psa" -> "ps", so "khopra" still finds "खोपरा" */
var Translit = (function () {
  var C = {
    "क":"k","ख":"kh","ग":"g","घ":"gh","ङ":"n","च":"ch","छ":"chh","ज":"j","झ":"jh","ञ":"n",
    "ट":"t","ठ":"th","ड":"d","ढ":"dh","ण":"n","त":"t","थ":"th","द":"d","ध":"dh","न":"n",
    "प":"p","फ":"ph","ब":"b","भ":"bh","म":"m","य":"y","र":"r","ल":"l","व":"v","श":"sh",
    "ष":"sh","स":"s","ह":"h","ळ":"l","क़":"k","ख़":"kh","ग़":"g","ज़":"z","ड़":"d","ढ़":"dh","फ़":"f"
  };
  var V = { "अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ए":"e","ऐ":"ai","ओ":"o","औ":"au","ऋ":"ri" };
  var M = { "ा":"aa","ि":"i","ी":"ee","ु":"u","ू":"oo","े":"e","ै":"ai","ो":"o","ौ":"au","ृ":"ri" };
  var NAS = { "ं":"n","ँ":"n","ः":"h" };

  function raw(str) {
    var out = "", i = 0, s = String(str || "");
    while (i < s.length) {
      var ch = s[i], nx = s[i + 1];
      // consonant + optional nukta already handled by the 2-char keys
      var two = ch + (nx || "");
      if (C[two]) { out += C[two]; i += 2; ch = null; }
      else if (C[ch]) { out += C[ch]; i += 1; }
      else if (V[ch]) { out += V[ch]; i += 1; continue; }
      else if (M[ch]) { out += M[ch]; i += 1; continue; }
      else if (NAS[ch]) { out += NAS[ch]; i += 1; continue; }
      else if (ch === "्") { i += 1; continue; }          // halant: no implicit a
      else { out += ch; i += 1; continue; }
      // after a consonant, add implicit "a" unless a matra/halant follows
      var after = s[i];
      if (!(after && (M[after] || after === "्"))) out += "a";
    }
    return out;
  }

  function fold(x) {
    return x.toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .replace(/ph/g, "f").replace(/c(?!h)/g, "k")
      .replace(/w/g, "v").replace(/z/g, "j").replace(/x/g, "ks")
      .replace(/[nm]/g, "n")
      .replace(/aa+/g, "a").replace(/ee+/g, "i").replace(/oo+/g, "u")
      .replace(/ai/g, "e").replace(/au/g, "o")
      .replace(/([a-z])\1+/g, "$1");
  }

  function norm(str) { return fold(raw(str)); }

  function skel(str) {
    return norm(str).replace(/[aeiouy]/g, "");
  }

  // latin input gets the same folding so both sides meet in the middle
  function normLatin(str) { return fold(String(str || "")); }

  function hasDeva(s) { return /[ऀ-ॿ]/.test(String(s || "")); }

  return {
    key: function (s) { return hasDeva(s) ? norm(s) : normLatin(s); },
    skel: function (s) { return (hasDeva(s) ? norm(s) : normLatin(s)).replace(/[aeiouy]/g, ""); }
  };
})();
