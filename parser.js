function ParserBootstrap() {

  let flag_idx = 0;
  const FLAG_N = ++flag_idx;
  const FLAG_H = ++flag_idx;
  const FLAG_G = ++flag_idx;
  const FLAG_F = ++flag_idx;

  const FLAG_xN = ++flag_idx;
  const FLAG_aN = ++flag_idx;
  const FLAG_xH = ++flag_idx;
  const FLAG_aH = ++flag_idx;
  const FLAG_xG = ++flag_idx;
  const FLAG_aG = ++flag_idx;
  const FLAG_xF = ++flag_idx;
  const FLAG_aF = ++flag_idx;

  const FLAG_NAMES = {
    true: [
      FLAG_xN, // FLAG_N
      FLAG_xH, // FLAG_H
      FLAG_xG, // FLAG_G
      FLAG_xF  // FLAG_F
    ],
    false: [
      FLAG_aN, // FLAG_N
      FLAG_aH, // FLAG_H
      FLAG_aG, // FLAG_G
      FLAG_aF  // FLAG_F
    ]
  };

  let tok_idx = 0;
  const TOK_END = ++tok_idx;
  const TOK_ARY = ++tok_idx;
  const TOK_CAT = ++tok_idx;
  const TOK_SUM = ++tok_idx;
  const TOK_OR = ++tok_idx;
  const TOK_AND = ++tok_idx;
  const TOK_NOT = ++tok_idx;
  const TOK_REP = ++tok_idx;
  const TOK_REPP = ++tok_idx;
  const TOK_CMP = ++tok_idx;
  const TOK_MCH = ++tok_idx;
  const TOK_RNG = ++tok_idx;
  const TOK_TXT = ++tok_idx;
  const TOK_CHR = ++tok_idx;
  const TOK_SUB = ++tok_idx;
  const TOK_X = ++tok_idx;
  const TOK_F = ++tok_idx;
  const TOK_IF = ++tok_idx;
  const TOK_ERR = ++tok_idx;
  const TOK_IDX = ++tok_idx;

  const TOK_NAMES = {
    end: TOK_END,
    ary: TOK_ARY,
    cat: TOK_CAT,
    sum: TOK_SUM,
    or: TOK_OR,
    and: TOK_AND,
    not: TOK_NOT,
    rep: TOK_REP,
    repp: TOK_REPP,
    cmp: TOK_CMP,
    mch: TOK_MCH,
    rng: TOK_RNG,
    txt: TOK_TXT,
    chr: TOK_CHR,
    sub: TOK_SUB,
    x: TOK_X,
    f: TOK_F,
    if: TOK_IF,
    err: TOK_ERR,
    idx: TOK_IDX
  };

  function parser_helper( snip, ctx ) {

    switch (snip.tok) {

      case TOK_END: {

        if (ctx.start_idx == ctx.solve.length) return {
          stop_idx: ctx.start_idx,

          start_idx: 0,
          solve: [],
          map: {},
          flag: ctx.flag
        };
        else return { error:true, flag:ctx.flag };
      };

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

          return {
            stop_idx: sub.stop_idx,

            start_idx: 0,
            solve: sub.solve,
            map: {},
            flag: flag
          };
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

        return {
          stop_idx: ret.stop_idx,

          start_idx: 0,
          solve: ret.solve,
          map: {},
          flag: flag
        };
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

      case TOK_REP:
      case TOK_REPP: {

        let ret = {
          stop_idx: ctx.start_idx,

          start_idx: 0,
          solve: [],
          map: {},
          flag: ctx.flag
        };

        let start_idx;
        do {

          start_idx = ret.stop_idx;

          let sub = parser(snip.argument, {
            start_idx: ret.stop_idx,
            solve: ctx.solve,
            map: ctx.map,
            flag: ctx.flag
          });

          if (sub.flag == FLAG_G) ret.flag = FLAG_G;
          else if (ret.flag != FLAG_G && sub.flag == FLAG_N) ret.flag = FLAG_N;

          if (sub.error) break;

          ret.solve.push(sub.solve);
          ret.stop_idx = sub.stop_idx;
        }
        while (start_idx < ret.stop_idx);

        if (snip.tok == TOK_REPP && ret.solve.length == 0) {
          return { error:true, flag:ret.flag };
        }

        return ret;
      };

      case TOK_CMP: {

        let stop_idx = ctx.start_idx;
        let text = "";
        let top = { error:true, flag:ctx.flag };

        let {map} = snip;
        while (stop_idx < ctx.solve.length) {

          const label = ctx.solve[stop_idx];
          map = map[label];

          if (map) {

            text += label;
            ++stop_idx;

            if (map.__END_FLAG__) top = {
              stop_idx: stop_idx,

              start_idx: 0,
              solve: text,
              map: {},
              flag: ctx.flag
            };
          }
          else break;
        }

        return top;
      };

      case TOK_TXT: {

        return {
          stop_idx: ctx.start_idx,

          start_idx: 0,
          solve: snip.text,
          map: {},
          flag: ctx.flag
        };
      };

      case TOK_CHR: {

        if (ctx.start_idx >= ctx.solve.length) {
          return { error:true, flag:ctx.flag };
        }

        return {
          stop_idx: ctx.start_idx + 1,

          start_idx: 0,
          solve: ctx.solve[ctx.start_idx],
          map: {},
          flag: ctx.flag
        };
      };

      case TOK_SUB: {

        let ret = {
          stop_idx: ctx.start_idx,

          start_idx: 0,
          solve: ctx.solve,
          map: {},
          flag: ctx.flag
        };

        for (const i in snip.path) {

          ret.solve = ret.solve[snip.path[i]];
        }

        return ret;
      };

      case TOK_X: {

        const sub = parse(snip.argument, ctx);

        if (sub.error) return sub;

        return {
          stop_idx: sub.stop_idx,

          start_idx: 0,
          solve: [],
          map: {},
          flag: sub.flag
        };
      };

      case TOK_F: {

        let stop_idx = false;
        for (const i in snip.arguments) {

          ctx = parser( snip.arguments[i], ctx );
          if (ctx.error) return ctx;

          if (stop_idx === false) stop_idx = ctx.stop_idx
        }

        if (stop_idx === false) return ctx;
        return {
          stop_idx: stop_idx,

          start_idx: 0,
          solve: ctx.solve,
          map: {},
          flag: ctx.flag
        };
      };

      case TOK_IF: {

        let ret_if = parser( snip.if, ctx );
        if (ret_if.error) return parser(snip.else, {

          start_idx: ctx.start_idx,
          solve: ctx.solve,
          map: ctx.map,
          flag: ret_if.flag
        });
        else {

          let ret_than = parser(snip.than, ret_if);
          if (ret_than.error) return ret_than;

          return {

            stop_idx: ret_if.stop_idx,

            start_idx: ret_than.start_idx,
            solve: ret_than.solve,
            map: ret_than.map,
            flag: ret_than.flag
          };
        }
      };

      case TOK_ERR: {

        return { error:true, flag:ctx.flag };
      };

      case TOK_IDX: {

        return {
          stop_idx: ctx.start_idx,

          start_idx: 0,
          solve: ctx.start_idx,
          map: {},
          flag: ctx.flag
        };
      }

      default:
        throw `bad tok ${snip.tok}`
    }
  }

  function parser( snip, ctx ) {

    if (!ctx.map[ctx.start_idx]) ctx.map[ctx.start_idx] = {};
    let state = ctx.map[ctx.start_idx][snip.id];

    if (!state) {

      state = { error:true, flag:FLAG_N };
      ctx.map[ctx.start_idx][snip.id] = state;
    }

    let stop_idx;
    do {
      stop_idx = state.stop_idx || ctx.start_idx;

      switch (state.flag) {
        case FLAG_H: {

          state = Object.assign({}, state, { flag:FLAG_G });
          ctx.map[ctx.start_idx][snip.id] = state;
        };
        case FLAG_G:
        case FLAG_F: {

          return state;
        };
        case FLAG_N: {

          state = Object.assign({}, state, { flag:FLAG_H });
          ctx.map[ctx.start_idx][snip.id] = state;

          break;
        };
      }

      state = parser_helper(snip, ctx);
      let state_flag = FLAG_NAMES[!!state.error][state.flag];

      let temp = ctx.map[ctx.start_idx][snip.id];
      let temp_flag = FLAG_NAMES[!!temp.error][temp.flag];

      switch (state_flag) {
        case FLAG_xN: switch (temp_flag) {
          case FLAG_xH: {

            return ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };
          };
          case FLAG_xG: {

            ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };

            break;
          };
          case FLAG_aH:
          case FLAG_aG: {

            state = Object.assign({}, temp, { flag:FLAG_F });
            ctx.map[ctx.start_idx][snip.id] = state;

            return state;
          };
        } break;
        case FLAG_xG: switch (temp_flag) {
          case FLAG_xG:
          case FLAG_xH: {

            ctx.map[ctx.start_idx][snip.id] = { error:true, flag:FLAG_N };

            return { error:true, flag:FLAG_G };
          };
          case FLAG_aH:
          case FLAG_aG: {

            state = Object.assign({}, temp, { flag:FLAG_F });
            ctx.map[ctx.start_idx][snip.id] = state;

            return state;
          };
        } break;
        case FLAG_xF: switch (temp_flag) {
          case FLAG_xG:
          case FLAG_xH:
          case FLAG_aH:
          case FLAG_aG: {

            state = Object.assign({}, temp, { flag:FLAG_F });
            ctx.map[ctx.start_idx][snip.id] = state;

            return state;
          };
        } break;
        case FLAG_aN: switch (temp_flag) {
          case FLAG_xH:
          case FLAG_aH: {

            state = Object.assign({}, state, { flag:FLAG_N });
            ctx.map[ctx.start_idx][snip.id] = state;

            return state;
          };
          case FLAG_xG:
          case FLAG_aG: {

            state = Object.assign({}, state, { flag:FLAG_N });
            ctx.map[ctx.start_idx][snip.id] = state;

            break;
          };
        } break;
        case FLAG_aG: switch (temp_flag) {
          case FLAG_xH:
          case FLAG_aH: {

            state = Object.assign({}, state, { flag:FLAG_N });
            ctx.map[ctx.start_idx][snip.id] = state;

            return Object.assign({}, state, { flag:FLAG_G });
          };
          case FLAG_xG:
          case FLAG_aG: {

            state = Object.assign({}, state, { flag:FLAG_N });
            ctx.map[ctx.start_idx][snip.id] = state;

            break;
          };
        } break;
        case FLAG_aF: switch (temp_flag) {
          case FLAG_xH:
          case FLAG_aH:
          case FLAG_xG:
          case FLAG_aG: {

            ctx.map[ctx.start_idx][snip.id] = state;

            return state;
          };
        } break;
      }
    }
    while ( stop_idx < state.stop_idx );

    state = Object.assign({}, state, { flag:FLAG_F });
    ctx.map[ctx.start_idx][snip.id] = state;
    return state;
  }

  function snipper_helper( info, [ root, ...ary ] ) {

    let tok = TOK_NAMES[root];

    if (tok == TOK_MCH) {

      let label = ary[0];

      if (info.name_map[label] == null) {

        let id = info.id_list.length;
        info.name_map[label] = id;
        info.id_list[id] = null;
        snip_apply(
          info, info.id_list, id,
          info.protosnip_map[label]
        );

        return id;
      }
      else return info.name_map[label];
    }

    let ret = {
      tok: tok,
      id: info.id_list.length
    };
    info.id_list[ret.id] = ret;

    switch (tok) {
      case TOK_OR: {

        info.or_list.push(ret);
      };

      case TOK_ARY:
      case TOK_AND:
      case TOK_F: {

        ret.arguments = [];
        for (const i in ary) {

          snip_apply(info, ret.arguments, i, ary[i]);
        }

        break;
      };

      case TOK_END:
      case TOK_CHR:
      case TOK_ERR: {

        break;
      }

      case TOK_CAT:
      case TOK_SUM:
      case TOK_NOT:
      case TOK_REP:
      case TOK_REPP:
      case TOK_X: {

        snip_apply(info, ret, "argument", ary[0]);

        break;
      };

      case TOK_CMP: {

        ret.map = {};
        for (const i in ary) {

          let text = ary[i];

          let {map} = ret;
          for (const j in text) {

            const c = text[j];

            if (map[c]) map = map[c];
            else map = map[c] = {};
          }

          map.__END_FLAG__ = true;
        }

        break;
      };

      case TOK_RNG: {

        let low = ary[0].charCodeAt(0);
        let high = ary[1].charCodeAt(0);

        ret.tok = TOK_CMP;

        ret.map = {};
        while (low <= high) {

          ret.map[String.fromCharCode(low++)] = { __END_FLAG__:true };
        }

        break;
      };

      case TOK_TXT: {

        ret.text = ary[0];

        break;
      };

      case TOK_SUB: {

        ret.path = ary;

        break;
      };

      case TOK_IF: {

        let [ snip_if, snip_than, snip_else ] = ary;

        snip_apply(info, ret, "if", snip_if || "err");
        snip_apply(info, ret, "than", snip_than || "err");
        snip_apply(info, ret, "else", snip_else || "err");

        break;
      };
    }

    return ret.id;
  }

  function snip_apply(info, mapto, mapat, string_or_snip) {

    let ret;
    if (string_or_snip == null) {

      throw `null snip`;
    }
    else if (typeof string_or_snip != "string") {

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
    else {

      ret = info.name_map[string_or_snip];
    }

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

  function mergecmp( a, b ) {

    let c = {};
    for (const i in a) {

      if (a[i] == true) {

        c[i] = true;
      }
      else {

        c[i] = mergecmp(a[i], b && b[i]);
      }
    }

    for (const i in b) {

      if (c[i]) continue;
      else if (b[i] == true) {

        c[i] = true;
      }
      else {

        c[i] = mergecmp(a && a[i], b[i]);
      }
    }

    return c;
  }

  function snipper(startname, protosnip_map) {

    const info = {
      protosnip_map: protosnip_map,
      or_list: [],
      name_map: {},
      id_list: [],
      build_list: {}
    };

    snip_apply( info, info, "root", startname );

    for (const id in info.build_list) {

      buildsnip( info, id );
    }

    for (const id in info.build_list) {

      if (info.build_list[id].length > 0) {

        throw "recursive definition error";
      }
    }

    if (!info.root) throw "no root found";

    for (const i in info.or_list) {

      const snip = info.or_list[i];
      const {arguments} = snip;

      let cmp = null, cmp_id;
      snip.arguments = [];

      for (const j in arguments) {

        const sub = arguments[j];
        if (sub.tok == TOK_CMP) {

          cmp_id = sub.id;
          cmp = mergecmp(sub.map, cmp);
        }
        else {

          if (cmp) {

            snip.arguments.push({
              tok: TOK_CMP,
              id: cmp_id,
              map: cmp
            });

            cmp = null;
          }
          snip.arguments.push(sub);
        }
      }

      if (cmp) {

        snip.arguments.push({
          tok: TOK_CMP,
          id: cmp_id,
          map: cmp
        });
      }
    }

    return info.root;
  }

  return (startname, protosnip_map) => {

    const snip = snipper(startname, protosnip_map);
    return solve => parser(snip, {
      start_idx: 0,
      flag: FLAG_F,
      solve: solve,
      map: {}
    });
  };
}
