FLAG_N = 0
FLAG_H = 1
FLAG_G = 2
FLAG_F = 3

FLAG_xN = 0
FLAG_aN = 1
FLAG_xH = 2
FLAG_aH = 3
FLAG_xG = 4
FLAG_aG = 5
FLAG_xF = 6
FLAG_aF = 7

FLAG_NAMES = {
    "true": [
        FLAG_xN, # FLAG_N
        FLAG_xH, # FLAG_H
        FLAG_xG, # FLAG_G
        FLAG_xF  # FLAG_F
    ],
    "false": [
        FLAG_aN, # FLAG_N
        FLAG_aH, # FLAG_H
        FLAG_aG, # FLAG_G
        FLAG_aF  # FLAG_F
    ]
}

TOK_ARY = 0
TOK_CAT = 1
TOK_SUM = 2
TOK_OR = 3
TOK_AND = 4
TOK_NOT = 5
TOK_REP = 6
TOK_CMP = 7
TOK_MCH = 8
TOK_RNG = 9
TOK_TXT = 10
TOK_CHR = 11
TOK_SUB = 12
TOK_X = 13
TOK_F = 14
TOK_IF = 15
TOK_ERR = 16

TOK_ARGS_LIST = {
    TOK_OR: True,
    TOK_ARY: True,
    TOK_AND: True,
    TOK_F: True
}

TOK_ARG_LIST = {
    TOK_CAT: True,
    TOK_SUM: True,
    TOK_NOT: True,
    TOK_REP: True,
    TOK_X: True
}

TOK_NAMES = {
    "ary": TOK_ARY,
    "cat": TOK_CAT,
    "sum": TOK_SUM,
    "or": TOK_OR,
    "and": TOK_AND,
    "not": TOK_NOT,
    "rep": TOK_REP,
    "cmp": TOK_CMP,
    "mch": TOK_MCH,
    "rng": TOK_RNG,
    "txt": TOK_TXT,
    "chr": TOK_CHR,
    "sub": TOK_SUB,
    "x": TOK_X,
    "f": TOK_F,
    "if": TOK_IF,
    "err": TOK_ERR
}

prim_protosnip = {
    "start": [
        "or",
        ["ary",["mch","start"],["cmp","b"]],
        ["cmp","a"]
    ]
}

def snipper_helper( info, snip ):

    tok = TOK_NAMES[snip[0]]
    ary = snip[1:]

    if tok is TOK_MCH:

        label = ary[0]

        if info["name_map"].get(label) is None:

            id = len(info["id_list"])
            info["name_map"][label] = id
            info["id_list"].append(None)
            snip_apply(
                info, info["id_list"], id,
                info["protosnip_map"][label]
            )

    ret = {
        "tok": tok,
        "id": len( info.id_list )
    }

    if tok is TOK_OR:

        info["or_list"].append(ret)

    if TOK_ARGS_LIST.get(tok) is not None:

        ret["arguments"] = []

        i = 0
        for arg in ary:

            snip_apply( info, ret["arguments"], i++, arg )

    elif TOK_ARG_LIST.get(tok) is not None:

        snip_apply( info, ret, "argument", ary[0] )

    elif tok == TOK_CMP:

        ret["map"] = {}
        for text in ary:

            map = ret["map"]
            for c in text:

                if map.get(c) is None:

                    map[c] = {}
                map = map[c]

            map["__END_FLAG__"] = True

    elif tok == TOK_RNG:



    return ret.id

def snip_apply(info, mapto, mapat, string_or_snip):

    ret = None

    if string_or_snip is None:

        raise NameError( "null snip" )
    elif not isinstance( string_or_snip, str ):

        ret = snipper_helper( info, string_or_snip )
    elif TOK_NAMES.get( string_or_snip ) is not None:

        ret = snipper_helper( info, [string_or_snip] )
    elif info["protosnip_map"].get( string_or_snip ) is None:

        raise NameError( "bad string " + str( string_or_snip ) )
    elif info["name_map"].get( string_or_snip ) is None:

        ret = len(info["id_list"])
        info["name_map"][ string_or_snip ] = ret
        info["id_list"].append(None)
        snip_apply(
            info, info["id_list"], ret,
            info["protosnip_map"][string_or_snip]
        )
    else:
        ret = info["name_map"][string_or_snip]

    if info["build_list"].get(ret) is None:
        info["build_list"][ret] = []
    info["build_list"][ret].append([ mapto,mapat,ret ])

    return ret

def snipper( protosnip_map, startname ):

    info = {
        "protosnip_map": protosnip_map,
        "or_list": [],
        "name_map": {},
        "id_list": [],
        "build_list": {}
    }

    snip_apply( info, info, "root", startname );

prim_snip = snipper(prim_protosnip, "start")
