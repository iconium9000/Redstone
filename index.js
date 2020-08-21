const prim_protosnip = {
  // start: [
  //   "or",
  //   ["ary",["mch","start"],["cmp","b"]],
  //   ["cmp","a"]
  // ]

  "pad": [
    "or",
    ["cmp"," ","\n","\t"],
    ["ary",["cmp","\//"],["rep",["if",["cmp","\n"],"err","chr"]],["cmp","\n"]],
    ["ary",["cmp","\/*"],["rep",["if",["cmp","*/"],"err","chr"]],["cmp","*/"]],
  ],
  "pad*": ["rep","pad"],

  "special": [
    "cmp"," ","\n","\t","\"",":",";",".",
    "!","*","+","|","&","#","]","}",")"
  ],

  "word": ["sum", ["cat", [
    "ary",
    ["ary","chr"],
    ["rep", [
      "or",
      ["f",["ary",["cmp","$"],"chr"],["sub","1"]],
      ["if",["mch","special"],"err","chr"]
    ]]
  ]]],

  "text": ["f",[
    "ary",
    ["cmp","\""],
    ["sum",["rep",[
      "or",
      ["f",["ary",["cmp","$"],"chr"],["sub","1"]],
      ["if",["cmp","\""],"err","chr"]
    ]]],
    ["cmp","\""]
  ], ["sub","1"]],

  "char": [
    "f",
    ["cmp","@"],
    ["ary",["txt","chr"]]
  ],

  "match": [
    "f",
    ["ary",["cmp","#"],["mch","word"]],
    ["ary",["txt","mch"],["sub","1"]]
  ],

  "compare": [
    "f",
    ["ary",["cmp","$"],["mch","word"]],
    ["ary",["txt","cmp"],["sub","1"]]
  ],

  "_sub": [
    "f", [
      "ary",
      ["cmp","."],
      ["mch","word"]
    ],
    ["sub","1"]
  ],
  "sub": ["or", ["cat", [
    "ary",
    ["ary",["txt","sub"]],
    ["or",["cat",[
      "ary",
      ["ary",["mch","_sub"]],
      ["rep",["mch","_sub"]]
    ]], ["f",["cmp","."],"ary"]]
  ]]],

  "list": [
    "or", "char", "match", "text", "compare", "sub", [
      "f", [
        "or", [
          "ary",
          ["cmp","("],
          ["mch","pad*"],
          ["mch","or"],
          ["mch","pad*"],
          ["cmp",")"]
        ], [
          "ary",
          ["cmp","{"],
          ["mch","pad*"],
          ["mch","or"],
          ["mch","pad*"],
          ["cmp","}"]
        ]
      ], ["sub","2"]
    ], [
      "f", [
        "ary",
        ["cmp","["],
        ["mch","pad*"],
        ["rep",["f",["ary",["mch","or"],["mch","pad*"]],["sub","0"]]],
        ["cmp","]"]
      ], ["cat",[
        "ary",
        ["ary",["txt","ary"]],
        ["sub","2"]
      ]]
    ]
  ],

  "postfix": [
    "or", [
      "f",
      ["ary",["mch","postfix"],["cmp","*"]],
      ["ary",["txt","rep"],["sub","0"]]
    ], [
      "f",
      ["ary",["mch","postfix"],["cmp","+"]],
      [
        "ary",
        ["txt","cat"],
        ["ary",["txt","ary"],["sub","0"]]
        ["ary",["txt","rep"],["sub","0"]]
      ]
    ], [
      "f", [
        "ary",
        ["mch","postfix"],
        ["cat",[
          "ary",
          ["ary",["mch","_sub"]],
          ["rep",["mch","_sub"]]
        ]]
      ], [
        "ary",
        ["cmp","f"],
        ["sub","0"],
        ["cat",[
          "ary",
          ["ary",["txt","sub"]],
          ["sub","1"]
        ]]
      ],
      ["mch","list"]
    ]
  ],

  "prefix": [
    "or", [
      "f",
      ["ary",["cmp","!"],["mch","prefix"]],
      ["ary",["txt","not"],["sub","1"]]
    ], [
      "f",
      ["ary",["cmp","+"],["mch","prefix"]],
      ["ary",["txt","sum"],["sub","1"]]
    ], [
      "f",
      ["ary",["cmp","*"],["mch","prefix"]],
      ["ary",["txt","cat"],["sub","1"]]
    ],
    ["mch","postfix"]
  ],

  "_fun": [
    "f", [
      "ary",
      ["mch","pad*"],
      ["cmp","=>"],
      ["mch","pad*"],
      ["mch","prefix"]
    ], ["sub","3"]
  ],
  "fun": [
    "or", [
      "cat", [
        "ary",
        ["ary",["txt","f"],["mch","prefix"]],
        ["cat",[
          "ary",
          ["ary",["mch","_fun"]],
          ["rep",["mch","_fun"]]
        ]]
      ]
    ]
  ]
};

const prim_snip = ParserBootstrap()( prim_protosnip, "list" );
log( "prim_snip", prim_snip );

const parsed_lex = prim_snip(`@`);
log(parsed_lex);
