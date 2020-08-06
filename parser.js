const {log} = console;

const FLAG_N = 0;
const FLAG_H = 1;
const FLAG_G = 2;
const FLAG_F = 3;

const TOK_ARY = 0;
const TOK_CAT = 1;
const TOK_SUM = 2;
const TOK_OR = 3;
const TOK_AND = 4;
const TOK_NOT = 5;
const TOK_REP = 6;
const TOK_CMP = 7;
const TOK_MCH = 8;
const TOK_RNG = 9
const TOK_TXT = 10;
const TOK_CHR = 11;
const TOK_SUB = 12;
const TOK_X = 13;
const TOK_F = 14;
const TOK_IF = 15;
const TOK_ERR = 16;

const TOK_NAMES = {
  ary: TOK_ARY,
  cat: TOK_CAT,
  sum: TOK_SUM,
  or: TOK_OR,
  and: TOK_AND,
  not: TOK_NOT,
  rep: TOK_REP,
  cmp: TOK_CMP,
  mch: TOK_MCH,
  rng: TOK_RNG,
  txt: TOK_TXT,
  chr: TOK_CHR,
  sub: TOK_SUB,
  x: TOK_X,
  f: TOK_F,
  if: TOK_IF,
  err: TOK_ERR
};

function parse_arguments( info, arguments, ctx ) {
  if (arguments) {
    const ret = {
      start_idx: ctx.start_idx,
      stop_idx: ctx.stop_idx,
      solve: [],
      flag: ctx.flag
    };
    let start_idx = ctx.start_idx;

    for (const i in arguments) {
      let sub = parser(info, arguments[i], {
        start_idx: start_idx,
        stop_idx: ctx.stop_idx,
        solve: ctx.solve,
        flag: ctx.flag
      });

      if (sub.flag == FLAG_G) ret.flag = FLAG_G;
      else if (ret.flag != FLAG_G && sub.flag == FLAG_N) ret.flag = FLAG_N;

      if (sub.error) return { error:true, flag:ret.flag };

      start_idx = sub.stop_idx;
      if (ret.stop_idx < sub.stop_idx) ret.stop_idx = sub.stop_idx;
      ret.solve.push(sub.solve);
    }

    return ret;
  }
  else return {
    start_idx: ctx.start_idx,
    stop_idx: ctx.stop_idx,
    solve: ctx.solve,
    flag: ctx.flag
  };
}

function parser_helper( info, snip, ctx ) {
  switch (snip.tok) {

    // arguments:snip[],null
    case TOK_ARY: {
      return parse_arguments( info, snip.arguments, ctx );
    }

    // arguments:snip[],null
    case TOK_CAT: {

      let ret = parse_arguments( info, snip.arguments, ctx );
      if (ret.error) return ret;

      const {solve} = ret;
      ret.solve = [];

      for (const i in solve) {
        ret.solve = ret.solve.concat(solve[i]);
      }

      return ret;
    }

    // arguments:snip[],null
    case TOK_SUM: {

      let ret = parse_arguments( info, snip.arguments, ctx );
      if (ret.error) return ret;

      const {solve} = ret;
      ret.solve = "";

      for (const i in solve) {
        ret.solve += solve[i];
      }

      return ret;
    }

    // path:string[], argument:snip,null
    case TOK_SUB: {

      const ret;
      if (ret.argument) {
        ret = parser(info, ret.argument, ctx);
        if (ret.error) return ret;
      }
      else ret = {
        start_idx: ctx.start_idx,
        stop_idx: ctx.stop_idx,
        solve: ctx.solve,
        flag: ctx.flag
      };

      for (const i in snip.path) {
        try {
          ret.solve = ret.solve[ snip.path[i] ];
        }
        catch (error) {
          return { error:true, flag:ret.flag };
        }
      }

      return ret;
    }

    // arguments:snip[]
    case TOK_OR: {

      let flag = FLAG_F;

      for (const i in snip.arguments) {

        const sub = parser(info, snip.arguments[i], ctx);

        if ( sub.flag == FLAG_G ) flag = FLAG_G;
        else if ( flag != FLAG_G && sub.flag == FLAG_N ) flag = FLAG_N;

        if (!sub.error) return {
          start_idx: sub.start_idx,
          stop_idx: sub.stop_idx,
          solve: sub.solve,
          flag: flag
        };
      }

      return { error:true, flag:flag };
    }

    // arguments:snip[]
    case TOK_AND: {

      let ret = ctx;
      let flag = FLAG_F;

      for (const i in snip.arguments) {
        ret = parser(info, snip.arguments[i], ctx);

        if ( ret.flag == FLAG_G ) flag = FLAG_G;
        else if ( flag != FLAG_G && ret.flag == FLAG_N ) flag = FLAG_N;

        if (ret.error) return { error:true, flag:flag };
      }

      return {
        start_idx: ret.start_idx,
        stop_idx: ret.stop_idx,
        solve: ret.solve,
        flag: flag
      };
    }

    // arguments:snip[]
    case TOK_NOT: {

      let flag = FLAG_F;

      for (const i in snip.arguments) {

        let sub = parser(info, snip.arguments[i], ctx);

        if ( sub.flag == FLAG_G ) flag = FLAG_G;
        else if ( flag != FLAG_G && sub.flag == FLAG_N ) flag = FLAG_N;

        if (!sub.error) return { error:true, flag:flag };
      }

      return {
        start_idx: ctx.start_idx,
        stop_idx: ctx.stop_idx,
        solve: ctx.solve,
        flag: flag
      };
    }

    // argument:snip
    case TOK_REP: {

      const ret = {
        start_idx: ctx.start_idx,
        stop_idx: ctx.start_idx,
        solve: [],
        flag:ctx.flag
      });

      while (true) {

        let sub = parser(info, snip.argument, {
          start_idx: ret.stop_idx,
          stop_idx: ret.stop_idx,
          solve: ctx.solve,
          flag: ctx.flag
        });

        if (sub.flag == FLAG_G) ret.flag = FLAG_G;
        else if (ret.flag != FLAG_G && sub.flag == FLAG_N) ret.flag = FLAG_N;

        if (sub.error || ret.stop_idx == sub.stop_idx) return ret;
        ret.stop_idx = sub.stop_idx;
        ret.solve.push(sub.solve);
      }
    }

    // snip: { map:{ "A": { end:true, "B":{ ... } } } }
    case TOK_CMP: {

      let stop_idx = ctx.start_idx;
      let text = "";
      let top = { error:true, flag:ctx.flag };

      let {map} = snip;
      while (stop_idx < info.string.length) {

        const char = info.string[stop_idx];
        map = map[char];

        if (map) {

          text += char;
          ++stop_idx;

          if (map.end) top = {
            start_idx: ctx.start_idx,
            stop_idx: stop_idx,
            solve: text,
            flag: ctx.flag
          };
        }
        else break;
      }

      return top;
    }

    // snip: { text:string }
    case TOK_TXT: {
      return {
        start_idx: ctx.start_idx,
        stop_idx: ctx.start_idx,
        solve: snip.text,
        flag: ctx.flag
      };
    }

    // snip: {}
    case TOK_CHR: {

      if (info.string.length >= ctx.start_idx) return {
        error: true,
        flag: ctx.flag
      };

      return {
        start_idx: ctx.start_idx,
        stop_idx: ctx.start_idx + 1,
        solve: info.string[ctx.start_idx],
        flag: ctx.flag
      };
    }

    // argument:snip,null
    case TOK_X: {
      if (snip.argument) {
        const ret = parser(info, snip.argument, ctx);

        if (ret.error) return ret;
        return {
          start_idx: ctx.start_idx,
          stop_idx: ctx.stop_idx,
          solve: [],
          flag: ret.flag
        };
      }
      else return {
        start_idx: ctx.start_idx,
        stop_idx: ctx.stop_idx,
        solve: [],
        flag: ctx.flag
      }
    }

    // arguments:snip[]
    case TOK_F: {
      for (const i in snip.arguments) {
        ctx = parser(info, snip.arguments[i], ctx);
        if (ctx.error) return ctx;
      }
      return ctx;
    }

    // arguments:[snip,snip,snip],[snip,snip]
    case TOK_IF: {
      let ret = parser(info, snip[0], ctx);

      if (ret.error) {
        if (ret[2]) return parser(info, snip[2], ctx);
        else return { error:true, flag:ret.flag };
      }
      else return parser(info, snip[1], ret);
    }

    case TOK_ERR: {
      return { error:true, flag:ctx.flag };
    }
  }
};

function parser( info, snip, ctx ) {
  let stop_idx = ctx.start_idx;

  if (!info.map[ctx.start_idx]) info.map[ctx.start_idx] = {};
  let state = info.map[ctx.start_idx][snip.id];

  if (!state) state = { error:true, flag:FLAG_N };

  do {
    if (!state.error) stop_idx = state.stop_idx;

    switch (state.flag) {
      case FLAG_H:
        state = Object.assign({}, state, { flag:FLAG_G });
        info.map[ctx.start_idx][snip.id] = state;
      case FLAG_F:
      case FLAG_G:
        return state;
      case FLAG_N:
        state = Object.assign({}, state, { flag:FLAG_H });
        info.map[ctx.start_idx][snip.id] = state;
        break;
    }

    let ret = parser_helper( info, snip.tok, ctx );
    state = info.map[ctx.start_idx][snip.id];

    if (ret.error) switch (ret.flag) {
      case FLAG_N: {
        if (state.error) {
          ret = { error:true, flag:FLAG_N };
          info.map[ctx.start_idx][snip.id] = ret;

          if ( state.flag == FLAG_H ) {
            return ret;
          }
          else {
            state = ret;
            break;
          }
        }
        else {
          state = Object.assign({}, state, { flag:FLAG_F });
          info.map[ctx.start_idx][snip.id] = state;
          return state;
        }
      }

      case FLAG_G: {
        if (state.error) {
          ret = { error:true, flag:FLAG_N };
          info.map[ctx.start_idx][snip.id] = ret;
          return { error:true, flag:FLAG_G };
        }
        else {
          state = Object.assign({}, state, { flag:FLAG_F });
          info.map[ctx.start_idx][snip.id] = state;
          return state;
        }
      }

      case FLAG_F: {
        state = Object.assign({}, state, { flag:FLAG_F });
        info.map[ctx.start_idx][snip.id] = state;
        return state;
      }
    }
    else switch (ret.flag) {
      case FLAG_N: {
        ret = Object.assign({}, ret, { flag:FLAG_N });
        info.map[ctx.start_idx][snip.id] = ret;

        if (state.flag == FLAG_H) {
          return ret;
        }
        else {
          state = ret;
          break;
        }
      }

      case FLAG_G: {
        ret = Object.assign({}, ret, { flag:FLAG_N });
        info.map[ctx.start_idx][snip.id] = ret;

        if (state.flag == FLAG_H) {
          return Object.assign({}, ret, { flag:FLAG_G });
        }
        else {
          state = ret;
          break;
        }
      }

      case FLAG_F: {
        ret = Object.assign({}, ret, { flag:FLAG_F });
        info.map[ctx.start_idx][snip.id] = ret;
        return ret;
      }
    }
  }
  while (state.error || stop_idx < state.stop_idx);

  state = Object.assign({}, state, { flag:FLAG_F });
  info.map[ctx.start_idx][snip.id] = state;
  return state;
}

function lexparser( string, snip ) {

  const info = {
    stack: [],
    map: {},
    string: string
  };
  const ctx = {
    start_idx: 0,
    stop_idx: 0,
    flag: FLAG_F,
    solve: []
  };

  return parser( info, snip, ctx );
}

function snipper_helper( builds, [root, ...ary] ) {
  switch ( TOK_NAMES[root] ) {
    // snip: { arguments:[...snip] }
    case TOK_ARY: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_ARY,
        arguments: []
      };
      for (const i in ary) {
        builds.push([snip.arguments,i,snipper_helper(builds,ary[i])]);
      }
      return snip;
    }
    // snip: { arguments:[...snip] }
    case TOK_CAT: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_CAT,
        arguments: []
      };
      for (const i in ary) {
        builds.push([snip.arguments,i,snipper_helper(builds,ary[i])]);
      }
      return snip;
    }
    // snip: { argument }
    case TOK_SUM: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_SUM
      };
      builds.push([snip,"argument",snipper_helper(builds,ary[0])]);
      return snip;
    }
    // snip: { arguments:[...snip] }
    case TOK_OR: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_OR,
        arguments: []
      };
      for (const i in ary) {
        builds.push([snip.arguments,i,snipper_helper(builds,ary[i])]);
      }
      return snip;
    }
    // snip: { arguments:[...snip] }
    case TOK_AND: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_AND,
        arguments: []
      };
      for (const i in ary) {
        builds.push([snip.arguments,i,snipper_helper(builds,ary[i])]);
      }
      return snip;
    }
    // snip: { arguments:[...snip] }
    case TOK_NOT: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_NOT,
        arguments: []
      };
      for (const i in ary) {
        builds.push([snip.arguments,i,snipper_helper(builds,ary[i])]);
      }
      return snip;
    }
    // snip: { argument:snip }
    case TOK_REP: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_REP,
      };
      builds.push([snip,"argument",snipper_helper(builds,ary[0])]);
      return snip;
    }
    // snip: { map:{ "A": map{ ... } } }
    case TOK_CMP: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_CMP,
        map: {}
      };
      for (const i in ary) {
        const text = ary[i];
        let {map} = snip;
        for (const j in text) {
          const char = text[j];
          if (!map[char]) map[char] = {};
          map = map[char];
        }
        map.end = true;
      }
      return snip;
    }
    // snip: { text:string }
    case TOK_MCH: {
      return ary[0];
    }
    // snip: { low:char, high:char }
    case TOK_RNG: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_CMP,
        map: {}
      };
      let low = ary[0].charCodeAt(0);
      let high = ary[1].charCodeAt(0);

      while (low <= high) {
        snip.map[String.fromCharCode(low++)] = { end:true };
      }
      return snip;
    }
    // snip: { text:string }
    case TOK_TXT: {
      let text = "";
      for (const i in ary) {
        text += ary[i];
      }
      return {
        id: ++builds.idx,
        tok: TOK_TXT,
        text: text
      };
    }
    // snip: {}
    case TOK_CHR: {
      return {
        id: ++builds.idx,
        tok: TOK_CHR
      };
    }
    // snip: { argument, path }
    case TOK_SUB: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_SUB,
        path: ary.slice(1)
      };
      builds.push([snip,"argument",snipper_helper(builds,ary[0])]);
      return snip;
    }
    // snip: { argument:snip }
    case TOK_X: {
      const snip = {
        id: ++builds.idx,
        tok: TOK_X,
      };
      builds.push([snip,"argument",snipper_helper(builds,ary[0])]);
      return snip;
    }
  }
}

function snipper( protosnip, startname ) {
  const snips = {};
  const builds = [];
  builds.idx = 0;

  for (const i in protosnip) {
    snips[i] = snipper_helper( builds, protosnip[i] );
  }

  for (let i = 0; i < builds.length; ++i) {
    const [ map,label,snip_or_match ] = builds[i];
    if (typeof snip_or_match == "string") {
      map[ label ] = snips[ snip_or_match ];
    }
    else {
      map[ label ] = snip_or_match;
    }
  }

  return snips[ startname ];
}

const prim_protosnip = {
  start: [
    "cat",
    ["x",["rep",["cmp"," "]]],
    ["cmp","a"],
    ["rep",["cmp","b"]]
  ]
};

const prim_snip = snipper(prim_protosnip, "start");
log("prim_snip",prim_snip);

const parsed_lex = lexparser("    abbb", prim_snip);
log(parsed_lex.solve)
