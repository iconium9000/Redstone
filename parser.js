const {log} = console;


const FLAG_N = 0;
const FLAG_H = 1;
const FLAG_G = 2;
const FLAG_F = 3;

const FLAG_xN = 0;
const FLAG_aN = 1;
const FLAG_xH = 2;
const FLAG_aH = 3;
const FLAG_xG = 4;
const FLAG_aG = 5;
const FLAG_xF = 6;
const FLAG_aF = 7;

const FLAG_NAMES = {
  true: {
    FLAG_N: FLAG_xN,
    FLAG_H: FLAG_xH,
    FLAG_G: FLAG_xG,
    FLAG_F: FLAG_xF
  },
  false: {
    FLAG_N: FLAG_aN,
    FLAG_H: FLAG_aH,
    FLAG_G: FLAG_aG,
    FLAG_F: FLAG_aF
  }
};

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

function parser_helper( snip, ctx ) {
  switch (snip.tok) {
    case TOK_ARY: {
      let ret = {
        stop_idx: ctx.start_idx,

        start_idx: 0,
        solve: [],
        map: {},
        flag: ctx.flag
      };

      for (const i in snip.arguments) {
        let sub = parser(snip.arguments[i], {
          start_idx: ret.stop_idx,
          solve: ctx.solve,
          map: ctx.map,
          flag: ctx.flag
        });

        if (sub.flag == FLAG_G) ret.flag = FLAG_G;
        else if (ret.flag != FLAG_G && sub.flag == FLAG_N) ret.flag = FLAG_N;

        if (sub.error) return { error:true, flag:ret.flag };

        ret.solve.push(sub.solve);
        ret.stop_idx = sub.stop_idx;
      }
      return ret;
    }

    case TOK_CAT: {
      let ret = parser(snip.argument, ctx);
      if (ret.error) return ret;

      let {solve} = ret;
      ret = {
        stop_idx: ret.stop_idx,

        start_idx: 0,
        solve: [],
        map: {},
        flag: ret.flag
      };
      for (const i in solve) {
        ret.solve = ret.solve.concat(solve[i]);
      }

      return ret;
    };

    case TOK_SUM: {
      let ret = parser(snip.argument, ctx);
      if (ret.error) return ret;

      let {solve} = ret;
      ret = {
        stop_idx: ret.stop_idx,

        start_idx: 0,
        solve: "",
        map: {},
        flag: ret.flag
      };
      for (const i in solve) ret.solve += solve[i];

      return ret;
    };

    case TOK_OR: {
      let flag = ctx.flag;
      for (const i in snip.arguments) {
        let sub = parser(snip.arguments[i], ctx);

        if (sub.flag == FLAG_G) flag = FLAG_G;
        else if (flag != FLAG_G && sub.flag == FLAG_N) flag = FLAG_N;

        if (sub.error) continue;

        return Object.assign({}, sub, { flag:flag });
      }

      return { error:true, flag:flag };
    };

    case TOK_AND: {
      let ret = ctx, flag = ctx.flag;

      for (const i in snip.arguments) {
        ret = parser(snip.arguments[i], ctx);

        if (ret.flag == FLAG_G) flag = FLAG_G;
        else if (flag != FLAG_G && ret.flag == FLAG_N) flag = FLAG_N;

        if (ret.error) return { error:true, flag:flag };
      }

      return ret;
    };

    case TOK_NOT: {
      let ret = parser(snip.argument, ctx);
      if (ret.error) return {
        stop_idx: ctx.start_idx,

        start_idx: 0,
        solve: [],
        map: {},
        flag: ret.flag
      };
      else return {
        error: true,
        flag: ret.flag
      };
    }

    case TOK_REP: {

      let ret = {
        stop_idx: ctx.start_idx,

        start_idx: 0,
        solve: [],
        map: {},
        flag: ctx.flag
      };

      let stop_idx;
      do {
        stop_idx = ret.stop_idx;

        let sub = parser(snip.argument, {
          start_idx: stop_idx,
          solve: ctx.solve,
          map: ctx.map,
          flag: ctx.flag
        });

        if (ret.flag == FLAG_G) ret.flag = FLAG_G;
        else if (ret.flag != FLAG_G && ret.flag == FLAG_N) ret.flag = FLAG_N;

        if (sub.error) break;

        ret.solve.push(sub.solve);

        ret.stop_idx = sub.stop_idx;
      }
      while (stop_idx < ret.stop_idx);

      return ret;
    };

    case TOK_CMP: {

      let stop_idx = ctx.start_idx;
      let text = "";
      let top = { error:true, flag:ctx.flag };

      let {map} = snip;
      while (stop_idx < info.solve.length) {

        const label = info.solve[stop_idx];
        map = map[label];

        if (map) {

          text += label;
          ++stop_idx;

          if (map.__END_FLAG__) top = {
            stop_idx: stop_idx,

            start_idx: 0,
            solve: text,
            flag: ctx.flag,
            map: {}
          };
        }
        else break;
      }

      return top;


    };
    case TOK_MCH: throw TOK_MCH;
    case TOK_RNG: throw TOK_RNG;
    case TOK_TXT: throw TOK_TXT;
    case TOK_CHR: throw TOK_CHR;
    case TOK_SUB: throw TOK_SUB;
    case TOK_X: throw TOK_X;
    case TOK_F: throw TOK_F;
    case TOK_IF: throw TOK_IF;
    case TOK_ERR: throw TOK_ERR;
  }
}

function parser( snip, ctx ) {

  if (!ctx.map[ctx.start_idx]) ctx.map[ctx.start_idx] = {};
  let state = ctx.map[ctx.start_idx][snip.id];

  if (!state) {
    state = { error:true, flag:FLAG_N };
    ctx.map[ctx.start_idx][snip.id] = state;
  }

  let start_idx = ctx.start_idx;
  do {
    switch (state.flag) {
      case FLAG_H:
        state = Object.assign({}, state, { flag:FLAG_G });
        ctx.map[ctx.start_idx][snip.id] = state;
      case FLAG_G:
      case FLAG_F:
        return state;
      case FLAG_N:
        state = Object.assign({}, state, { flag:FLAG_H });
        ctx.map[ctx.start_idx][snip.id] = state;
        break;
    }

    state = parser_helper(snip, ctx);
    let state_flag = FLAG_NAMES[!!state.error][state.flag];

    let temp = ctx.map[ctx.start_idx][snip.id];
    let temp_flag = FLAG_NAMES[!!temp.error][temp.flag];

    switch (state_flag) {
      case FLAG_xN: switch (temp_flag) {
        case FLAG_xH:
          return ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };
        case FLAG_xG:
          ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };
          break;
        case FLAG_aH:
        case FLAG_aG:
          state = Object.assign({}, temp, { flag:FLAG_F });
          ctx.map[ctx.start_idx][snip.id] = state;
          return state;
      } break;
      case FLAG_xG: switch (temp_flag) {
        case FLAG_xG:
        case FLAG_xH:
          ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };
          return { error:true, flag:FLAG_G };
        case FLAG_aH:
        case FLAG_aG:
          state = Object.assign({}, temp, { flag:FLAG_F });
          ctx.map[ctx.start_idx][snip.id] = state;
          return state;
      } break;
      case FLAG_xF: switch (temp_flag) {
        case FLAG_xG:
        case FLAG_xH:
        case FLAG_aH:
        case FLAG_aG:
          state = Object.assign({}, temp, { flag:FLAG_F });
          ctx.map[ctx.start_idx][snip.id] = state;
          return state;
      } break;
      case FLAG_aN: switch (temp_flag) {
        case FLAG_xH:
        case FLAG_aH:
          state = Object.assign({}, state, { flag:FLAG_N });
          ctx.map[ctx.start_idx][snip.id] = state;
          return state;
        case FLAG_xG:
        case FLAG_aG:
          state = Object.assign({}, state, { flag:FLAG_N });
          ctx.map[ctx.start_idx][snip.id] = state;
          break;
      } break;
      case FLAG_aG: switch (temp_flag) {
        case FLAG_xH:
        case FLAG_aH:
          state = Object.assign({}, state, { flag:FLAG_N });
          ctx.map[ctx.start_idx][snip.id] = state;
          return Object.assign({}, state, { flag:FLAG_G });
        case FLAG_xG:
        case FLAG_aG:
          state = Object.assign({}, state, { flag:FLAG_N });
          ctx.map[ctx.start_idx][snip.id] = state;
          break;
      } break;
      case FLAG_aF: switch (temp_flag) {
        case FLAG_xH:
        case FLAG_aH:
        case FLAG_xG:
        case FLAG_aG:
          state = Object.assign({}, state, { flag:FLAG_F });
          ctx.map[ctx.start_idx][snip.id] = state;
          return state;
      } break;
    }
  }
  while (start_idx < state.start_idx);

  ctx.map[ctx.start_idx][snip.id] = state;
  return state;
}

function snipper_helper( info, [ root, ...ary ] ) {

}

function snip_apply(info, mapto, mapat, string_or_snip) {
  let ret;
  if (string_or_snip == null) {
    throw `null snip`;
  }
  if (typeof string_or_snip != "string") {
    ret = snipper_helper( info, string_or_snip );
  }
  else if (TOK_NAMES[string_or_snip] != null) {
    ret = snipper_helper( info, [string_or_snip] );
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
      info.protosnip_map[string_or_snip]
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
  ]
};

const prim_snip = snipper(prim_protosnip, "start");
log("prim_snip",prim_snip);

const parsed_lex = parser(info, prim_snip, {
  start_idx: 0,
  flag: FLAG_F,
  solve: "abb",
  map: {}
});
log(parsed_lex.solve);
