import copy as Copy

def error(errorName):

    raise NameError(errorName)

class Solve:

    def __init__(self, ret, retidx):

        self.startidx = 0
        self.save = {}
        self.err = False
        self.rec = False

        self.ret = ret
        self.retidx = retidx

    def copy(self):

        copy = Solve(self.ret, self.retidx)
        copy.startidx = self.startidx
        copy.save = self.save
        copy.err = self.err
        copy.rec = self.rec

        return copy
    
    def error(self):

        self.err = True
        return self

class Blip:

    def __init__(self):

        self.id = None
        self.next = None
        self.error = None
        self.down = None

    def setNext(self, blipnext):

        while self.next is not None:

            self = self.next

        self.next = blipnext

    def setDown(self, blipdown):

        while self.down is not None:

            self = self.down

        self.down = blipdown

    def setError(self, bliperror):

        while self.error is not None:

            self = self.error

        self.error = bliperror
    
    def _copy(self):

        return self.__class__()

    def copy(self):

        copy = self._copy()

        copy.id = self.id

        if self.next is not None:

            copy.next = self.next.copy()

        if self.error is not None:

            copy.error = self.error.copy()

        if self.down is not None:

            copy.down = self.down.copy()

        return copy

    def _str(self):

        return ""

    def __str__(self):

        return self._str() + "(" + str(self.next) + str(self.error) + str(self.down) + ")"

    def _solve(self, solve):

        return solve.copy()

    def solve(self, solve):

        savemap = solve.save.get(solve.startidx)
        
        if savemap is None:

            savemap = {}
            solve.save[solve.startidx] = savemap
        
        ret = savemap.get(self.id)

        if ret is not None and ret.rec is False:

            return ret.copy()

        ret = self._solve(solve)

        if ret.err is False and self.down is not None:

            retrec = ret.rec
            retidx = ret.retidx
            ret = self.down.solve(solve)
            ret.retidx = retidx
            ret.rec = ret.rec or retrec

        if ret.err is False and self.next is not None:

            retrec = ret.rec
            ret = self.next.solve(solve)
            ret.rec = ret.rec or retrec

        if ret.err is True and self.error is not None:

            retrec = ret.rec
            ret = self.error.solve(solve)
            ret.rec = ret.rec or retrec

        savemap[self.id] = ret

        return ret

class AryBlip(Blip):

    def __init__(self):
        Blip.__init__(self)

        self.blips = []

    def _str(self):
        
        ret = "ary["

        for blip in self.blips:

            ret += str(blip)

        return ret + "]"
    
    def _copy(self):

        copy = AryBlip()

        for blip in self.blips:

            copy.blips.append(blip.copy())

        return copy

    def _solve(self, solve):

        ret = Solve([], solve.startidx)

        for blip in self.blips:
            
            sub = solve.copy()
            sub.startidx = ret.retidx
            sub = blip.solve(sub)
            ret.rec = ret.rec or sub.rec

            if sub.err:

                return ret.error()

            ret.ret.append(sub.ret)
            ret.retidx = sub.retidx

        return ret

class IdxBlip(Blip):

    def _str(self):

        return "idx"
    
    def _solve(self, solve):

        return Solve(solve.startidx, solve.startidx)

class EndBlip(Blip):

    def _str(self):

        return "end"
    
    def _solve(self, solve):

        ret = Solve("end", solve.startidx)

        if len(solve.ret) <= solve.startidx:

            return ret

        else:

            return ret.error()

class ErrBlip(Blip):

    def _str(self):

        return "err"

    def _solve(self, solve):

        return Solve("err", solve.startidx).error()

class NxtBlip(Blip):

    def _str(self):

        return "nxt"

    def _solve(self, solve):

        try:
            
            return Solve(solve.ret[solve.startidx], solve.startidx + 1)

        except:

            return Solve("nxt", solve.startidx).error()

class RecBlip(Blip):

    def __init__(self, bid):
        Blip.__init__(self)

        self.id = bid
        self.copies = [self]
        self.inside = None

    def _str(self):

        return "rec" + str(self.id)
    
    def _copy(self):

        copy = RecBlip(self.id)
        copy.copies = self.copies
        self.copies.append(copy)
        return copy

    def _solve(self, solve):

        savemap = solve.save[solve.startidx]

        ret = savemap.get(self.id)

        if ret is not None:

            return ret.copy()

        ret = Solve("", solve.startidx).error()
        ret.rec = True

        while True:

            savemap[self.id] = ret
            sub = self.inside.solve(solve)

            if sub.err or sub.retidx <= ret.retidx:

                ret.rec = False
                return ret

            ret = sub

class InsideBlip(Blip):

    def __init__(self, inside):
        Blip.__init__(self)

        self.inside = inside

    def _str(self):

        return "inside" + str(self.inside)

    def _copy(self):

        return InsideBlip(self.inside.copy())

    def _solve(self, solve):

        return self.inside.solve(solve)

class IfBlip(Blip):

    def __init__(self, ifcheck, ifnoerr, iferr):
        Blip.__init__(self)

        self.ifcheck = ifcheck
        self.ifnoerr = ifnoerr
        self.iferr = iferr

    def _str(self):

        return "if" + str(self.ifcheck) + str(self.ifnoerr) + str(self.iferr)

    def _copy(self):

        return IfBlip(self.ifcheck.copy(), self.ifnoerr.copy(), self.iferr.copy())

    def _solve(self, solve):

        ret = self.ifcheck.solve(solve)
        
        if ret.err:

            return self.iferr.solve(solve)

        else:

            return self.ifnoerr.solve(solve)

class RepBlip(Blip):

    def __init__(self, rep, low, high):
        Blip.__init__(self)
        
        self.rep = rep
        self.low = low
        self.high = high

    def _str(self):

        return "rep" + str(self.rep) + str(self.low) + "," + str(self.high)

    def _copy(self):

        return RepBlip(self.rep.copy(), self.low, self.high)

    def _solve(self, solve):

        ret = Solve([], solve.startidx)

        while True:
            
            sub = solve.copy()
            sub.startidx = ret.retidx
            sub = self.rep.solve(sub)
            ret.rec = ret.rec or sub.rec

            if sub.retidx <= ret.retidx or sub.err:

                break
            
            ret.ret.append(sub.ret)
            ret.retidx = sub.retidx

        size = len(ret.ret)

        if self.low <= size and size < self.high:

            return ret

        return ret.error()

class SumBlip(InsideBlip):

    def _str(self):

        return "sum" + str(self.inside)

    def _solve(self, solve):

        sub = self.inside.solve(solve.copy())

        if sub.err:

            return sub

        ret = Solve("", sub.retidx)
        ret.rec = sub.rec

        for subret in sub.ret:

            ret.ret += subret

        return ret
     
class CatBlip(InsideBlip):

    def _str(self):

        return "cat" + str(self.inside)

    def _solve(self, solve):

        sub = self.inside.solve(solve.copy())

        if sub.err:

            return sub

        ret = Solve([], sub.retidx)
        ret.rec = sub.rec

        for subret in sub.ret:

            ret.ret += subret

        return ret
    
class NotBlip(InsideBlip):

    def _str(self):

        return "not" + str(self.inside)

    def _solve(self, solve):

        sub = self.inside.solve(solve)
        ret = Solve("", sub.retidx)
        ret.rec = sub.rec
        
        if sub.err:

            return ret
        
        return ret.error()

class IntBlip(InsideBlip):

    def _str(self):

        return "int" + str(self.inside)
    
    def _solve(self, solve):

        sub = self.inside.solve(solve)

        if sub.err:

            return sub

        ret.ret = int(ret.ret)

        return ret

class StrBlip(InsideBlip):

    def _str(self):

        return "str" + str(self.inside)

    def _solve(self, solve):

        sub = self.inside.solve(solve)

        if sub.err:

            return sub

        ret.ret = str(ret.ret)

        return ret

class CmpBlip(Blip):

    def __init__(self):
        Blip.__init__(self)

        self.cmp = {}

    def _str(self):

        return "cmp" + str(self.cmp)
    
    def setError(self, bliperror):

        if isinstance(bliperror, CmpBlip):

            self.cmp = CmpBlip.merge(self.cmp, bliperror.cmp)

        else:

            Blip.setError(self, bliperror)
    
    def merge(self, other):

        if self == True or other == True:
        
            return True

        if self is None:
        
            self = {}

        if other is None:
        
            other = {}

        merge = {}

        for i in self:
        
            merge[i] = CmpBlip.merge(self[i], other.get(i))

        for i in other:
        
            if merge.get(i) is None:
        
                merge[i] = CmpBlip.merge(self.get(i), other[i])

        return merge

    def _copy(self):

        copy = CmpBlip()
        copy.cmp = Copy.deepcopy(self.cmp)

        return copy

    def _solve(self, solve):

        cmpmap = self.cmp
        cmpstr = ""
        startidx = solve.startidx
        ret = Solve("", solve.startidx).error()

        while startidx < len(solve.ret):

            label = solve.ret[startidx]
            cmpmap = cmpmap.get(label)

            if cmpmap is None:

                break

            cmpstr += label
            startidx += 1

            if cmpmap.get("__ENDCMP__") is True:

                ret = Solve(cmpstr, startidx)
        
        return ret

class SubBlip(Blip):

    def __init__(self):
        Blip.__init__(self)

        self.blips = []

    def _str(self):

        ret = "sub["

        for blip in self.blips:

            ret += str(blip)

        return ret + "]"

    def _copy(self):

        copy = SubBlip()

        for blip in self.blips:

            copy.blips.append(blip.copy())

        return copy

    def _solve(self, solve):

        ret = Solve(solve.ret, solve.startidx)

        for blip in self.blips:

            try:

                sub = blip.solve(solve)
                ret.rec = sub.rec
                
                if sub.err:

                    raise Exception()
                
                ret.ret = ret.ret[sub.ret]

            except:
                
                return ret.error()

        return ret

class TxtBlip(Blip):

    def __init__(self, txt):
        Blip.__init__(self)

        self.txt = txt

    def _str(self):
        
        return "txt" + self.txt

    def _copy(self):

        return TxtBlip(self.txt)

    def _solve(self, solve):

        return Solve(self.txt, solve.startidx)

class NumBlip(Blip):

    def __init__(self, num):
        Blip.__init__(self)

        self.num = num

    def _str(self):
        
        return "num" + str(self.num)

    def _copy(self):

        return NumBlip(self.num)

    def _solve(self, solve):

        return Solve(self.num, solve.startidx)

class ParserMaker:

    def snip_ary(self, snips, args):

        ret = AryBlip()

        for snip in snips:

            ret.blips.append(self.snipBlip(snip, args))

        return ret

    def snip_f(self, snips, args):

        ret = self.snipBlip(snips[0], args)
        
        for snip in snips[1:]:

            ret.setDown(self.snipBlip(snip, args))
            
        return ret

    def snip_or(self, snips, args):

        ret = self.snipBlip(snips[0], args)

        for snip in snips[1:]:

            ret.setError(self.snipBlip(snip, args))
        
        return ret
    
    def snip_and(self, snips, args):

        ret = self.snipBlip(snips[0], args)

        for snip in snips[1:]:

            ret.setNext(self.snipBlip(snip, args))

        return ret
    
    def snip_if(self, snips, args):
        
        return IfBlip(
            self.snipBlip(snips[0], args),
            self.snipBlip(snips[1], args),
            self.snipBlip(snips[2], args)
        )

    def snip_rep(self, snips, args):

        sniplen = len(snips)
        low = 0
        high = float('inf')

        if sniplen == 2:

            low = snips[1]
            high = snips[1]

        elif sniplen > 2:

            low = snips[1]
            high = snips[2]

        return RepBlip(self.snipBlip(snips[0], args), low, high)

    def snip_sum(self, snips, args):

        return SumBlip(self.snipBlip(snips[0], args))

    def snip_cat(self, snips, args):

        return CatBlip(self.snipBlip(snips[0], args))

    def snip_not(self, snips, args):

        return NotBlip(self.snipBlip(snips[0], args))

    def snip_int(self, snips, args):

        return IntBlip(self.snipBlip(snips[0], args))

    def snip_str(self, snips, args):

        return StrBlip(self.snipBlip(snips[0], args))

    def snip_idx(self, snips, args):

        return IdxBlip()

    def snip_end(self, snips, args):

        return EndBlip()

    def snip_err(self, snips, args):

        return ErrBlip()

    def snip_nxt(self, snips, args):

        return NxtBlip()

    def snip_cmp(self, snips, args):

        ret = CmpBlip()

        for word in snips:

            charmap = ret.cmp

            for char in word:

                if charmap.get(char) is None:

                    charmap[char] = {}

                charmap = charmap[char]

            charmap["__ENDCMP__"] = True

        return ret
    
    def snip_rng(self, snips, args):

        ret = CmpBlip()

        endcmp = { "__ENDCMP__": True }
        for i in range(ord(snips[0]), ord(snips[1]) + 1):

            ret.cmp[chr(i)] = endcmp
        
        return ret

    def snip_mch(self, snips, args):

        newargs = []

        for snip in snips[1:]:

            newargs.append(self.snipBlip(snip, args))

        return self.snipBlip(self.snipmap[snips[0]], newargs)

    def snip_arg(self, snips, args):

        return args[snips[0]].copy()

    def snip_sub(self, snips, args):

        ret = SubBlip()

        for snip in snips:

            ret.blips.append(self.snipBlip(snip, args))

        return ret

    def snip_txt(self, snips, args):

        return TxtBlip(snips[0])

    def snip_num(self, snips, args):

        return NumBlip(snips[0])


    def __init__(self, startname, snipmap):

        self.snipmap = snipmap
        self.tok_snips_args_map = {}
        self.bliplist = []
        self.blipmap = {}

        self.snipfuns = {
            "ary": self.snip_ary,

            "f": self.snip_f,
            "if": self.snip_if,
            "or": self.snip_or,
            "and": self.snip_and,

            "rep": self.snip_rep,            
            "not": self.snip_not,
            "sum": self.snip_sum,
            "cat": self.snip_cat,
            "int": self.snip_int,
            "str": self.snip_str,

            "end": self.snip_end,
            "err": self.snip_err,
            "nxt": self.snip_nxt,
            "idx": self.snip_idx,

            "cmp": self.snip_cmp,
            "rng": self.snip_rng,

            "mch": self.snip_mch,
            "arg": self.snip_arg,
            "sub": self.snip_sub,
            "txt": self.snip_txt,
            "num": self.snip_num
        }

        self.blip = self.snipBlip(self.snipmap[startname], [])

    def snipSwitch(self, tok, snips, args):

        argstrs = []

        for arg in args:

            argstrs.append(str(arg))

        tok_snips_args_str = str([tok, snips, argstrs])
        bid = self.tok_snips_args_map.get(tok_snips_args_str)

        if bid is not None:

            return self.bliplist[bid].copy()

        blip = RecBlip(len(self.bliplist))
        self.tok_snips_args_map[tok_snips_args_str] = blip.id
        self.bliplist.append(blip)

        funblip = self.snipfuns[tok](snips, args)

        if funblip.id is None:

            funblipstr = str(funblip)
            bid = self.blipmap.get(funblipstr)

            if bid is None:

                funblip.id = blip.id
                self.blipmap[funblipstr] = blip.id
            
            else:

                funblip = self.bliplist[funblip.id]

        for copy in blip.copies:

            copy.inside = funblip

        if len(blip.copies) > 1:

            funblip = blip
            
        self.bliplist[blip.id] = funblip
        return funblip

    def snipBlip(self, snip, args):

        if isinstance(snip, int) is True:

            return self.snipSwitch("num",[snip], args)

        elif isinstance(snip, str) is False:

            return self.snipSwitch(snip[0], snip[1:], args)

        snipfun = self.snipfuns.get(snip)
        
        if snipfun is not None:

            return snipfun([], args)

        mappedsnip = self.snipmap.get(snip)

        if mappedsnip is not None:

            return self.snipSwitch(mappedsnip[0], mappedsnip[1:], args)
        
        return self.snipSwitch("txt", [snip], args)

def Parser(startname, snipmap):

    blip = ParserMaker(startname, snipmap).blip

    def ret(ret):
    
        return blip.solve(Solve(ret, 0))

    return ret

test = Parser("word", {
    "pad": [
        "or",
        ["cmp"," ","\n","\t"],
        [
            "ary",
            ["cmp","//"],
            ["rep",["if",["cmp","\n"],"err","nxt"]],
            ["cmp","\n"]
        ],
        [
            "ary",
            ["cmp","/*"],
            ["rep",["if",["cmp","*/"],"err","nxt"]],
            ["cmp","*/"]
        ]
    ],
    "pad*": ["rep","pad"],
    "special": [
        "or",
        "pad",
        [
            "cmp",
            ":",";",".",
            "!","*","+",
            "|","&","#",
            "[","{","(",
            "]","}",")"
        ]
    ],
    "word": ["sum",["cat",[
        "ary",
        ["ary","nxt"],
        ["rep",["or",
            ["f",["ary",["cmp","$"],"nxt"],["sub",1]],
            ["if","special","err","nxt"]
        ]]
    ]]]
})

ret = test("asdf")

print(str(ret.ret))