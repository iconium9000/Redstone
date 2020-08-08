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

    // arguments:snip[]
    case TOK_ARY: {
      return parse_arguments( info, snip.arguments, ctx );
    }

    // arguments:snip[],false
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

    // arguments:snip[],false
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

    // path:string[], argument:snip,false
    case TOK_SUB: {

      let ret;
      if (ctx.argument) {
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

    // argument:snip
    case TOK_NOT: {
      const ret = parser(info, snip.argument, ctx);

      if (ret.error) return ctx;
      return { error:true, flag:ret.flag };
    }

    // argument:snip
    case TOK_REP: {

      const ret = {
        start_idx: ctx.start_idx,
        stop_idx: ctx.start_idx,
        solve: [],
        flag:ctx.flag
      };

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

    // argument:snip,false
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

    // if:snip, than:snip, else:snip
    case TOK_IF: {
      let ret = parser(info, snip.if, ctx);

      if (ret.error) return parser(info, snip.else, ctx);
      else return parser(info, snip.than, ret);
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

function snipper_helper( info, [ root, ...ary ], solve_boolean ) {

  let noarg = solve_boolean;
  const tok = TOK_NAMES[ root ];

  if (tok == TOK_MCH) {
    let [text] = ary;

    if (info.name_map[text] != null) {
      return info.name_map[text];
    }

    if (info.protosnip_map[text] == null) {
      throw `bad mch "${text}"`;
    }

    let id = info.id_list.length;
    info.name_map[text] = id;
    info.id_list[id] = null;
    snip_apply(
      info, info.id_list, id,
      info.protosnip_map[text],
      solve_boolean
    );
    return id;
  }

  let ret = {
    id: info.id_list.length,
    tok: tok
  };
  info.id_list.push(ret);

  switch (tok) {

    // arguments:snip[]
    case TOK_ARY:
    case TOK_OR:
    case TOK_AND:
      noarg = false;

    // arguments:snip[],false
    case TOK_CAT:
    case TOK_SUM: {
      if (noarg) break;

      ret.arguments = [];
      for (const i in ary) {
        snip_apply(info, ret.arguments, i, ary[i], solve_boolean);
      }
      break;
    }

    // snip, ...string
    // ...string
    // path:string[], argument:snip,false
    case TOK_SUB: {
      if (noarg) {
        ret.path = ary;
        break;
      }
      else {
        ret.path = ary.slice(1);
      }
    }

    // argument:snip
    case TOK_NOT:
    case TOK_X:
    case TOK_REP: {
      snip_apply(info, ret, "argument", ary[0], solve_boolean);
      break;
    }

    case TOK_CHR:
    case TOK_ERR: break;

    // ...string
    // map:{ "A": { end:true, "B":{ ... } } }
    case TOK_CMP: {

      ret.map = {};
      for (const i in ary) {
        const text = ary[i];
        let {map} = ret;

        for (const j in text) {
          const c = text[j];

          if (map[c]) map = map[c];
          else map = map[c] = {};
        }

        map.end = true;
      }

      break;
    }

    // ...string
    // text:string
    case TOK_TXT: {
      ret.text = "";
      for (const i in ary) ret.text += ary[i];
      break;
    }

    // arguments:snip[]
    case TOK_F: {
      ret.arguments = [];
      for (const i in ary) {
        snip_apply(info, ret.arguments, i, ary[i], solve_boolean);
        solve_boolean = true;
      }
      break;
    }

    // snip, snip, snip
    // snip, snip
    // if:snip, than:snip, else:snip
    case TOK_IF: {
      const [snip_if,snip_than,snip_else] = ary;

      snip_apply(info, ret, "if", snip_if, solve_boolean);
      snip_apply(info, ret, "than", snip_than, true);
      snip_apply(info, ret, "else", snip_than || ["err"], solve_boolean);

      break;
    }

    default: throw `bad tok "${tok}"`
  }

  return ret.id;
}

function snip_apply(info, mapto, mapat, string_or_snip, solve_boolean) {
  let ret;
  if (string_or_snip == null) {
    throw `null snip`;
  }
  if (typeof string_or_snip != "string") {
    ret = snipper_helper( info, string_or_snip, solve_boolean );
  }
  else if (TOK_NAMES[string_or_snip] != null) {
    ret = snipper_helper( info, [string_or_snip], solve_boolean );
  }
  else if (info.protosnip_map[string_or_snip] == null) {
    throw `bad string "${string_or_snip}"`;
  }
  else if (info.name_map[string_or_snip] == null) {
    ret = info.id_list.length;
    info.name_map[string_or_snip] = ret;
    info.id_list[ret] = null;
    snip_apply(
      info, info.id_list, ret,
      info.protosnip_map[string_or_snip],
      solve_boolean
    );
  }
  else ret = info.name_map[string_or_snip];

  if (!info.build_list[ret]) info.build_list[ret] = [];
  info.build_list[ret].push([mapto,mapat,ret]);

  return ret;
}

function buildsnip( info, id ) {

  const snip = info.id_list[id];
  if (!snip) return;

  for (const i in info.build_list[id]) {
    const [ mapto, mapat ] = info.build_list[id][i];
    if (mapto == info.id_list && mapto[mapat] == null) {
      mapto[mapat] = snip;
      buildsnip(info, mapat);
    }
    else mapto[mapat] = snip;
  }

  info.build_list[id] = [];
}

function snipper( protosnip_map, startname ) {

  const info = {
    protosnip_map: protosnip_map,
    name_map: {},
    id_list: [],
    build_list: {}
  };

  snip_apply( info, info, "root", startname, false );

  for (const id in info.build_list) buildsnip( info, id );

  for (const id in info.build_list) {
    if (info.build_list[id].length > 0) {
      throw "recursive definition error";
    }
  }

  if (!info.root) throw "no root found";
  return info.root;
}

const prim_protosnip = {
  // start: [ "ary" ]
  start: [
    "or",
    ["ary","start",["cmp","b"]],
    ["cmp","a"],
    ["mch","test"],
  ],
  test: ["mch","foo"],
  foo: ["cmp","test"]
};

const prim_snip = snipper(prim_protosnip, "start");
log("prim_snip",prim_snip);

const parsed_lex = lexparser("    abbb", prim_snip);
log(parsed_lex.solve)
