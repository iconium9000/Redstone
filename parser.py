import copy as Copy

def error(errorName):

    raise NameError(errorName)

class Solve:

    retidx = 0

    startidx = 0
    save = {}
    flag = False

    err = False

    def __init__(self, string, flag, retidx):

        self.string = string
        self.flag = flag
        self.retidx = retidx

    def setFlag(self, flag):

        self.flag = flag
        return self

    def copy(self):

        copy = self.__class__(self.string, self.flag, self.retidx)
        copy.startidx = self.startidx
        copy.save = self.save
        copy.err = self.err

        return copy
    
    def error(self):

        error.err = True
        return error

class Blip:

    def __init__(self):

        self.id = None
        self.next = None
        self.error = None
        self.down = None

    def setNext(self, blipnext):

        blip = self

        while blip.next is not None:

            blip = blip.next

        blip.next = blipnext

    def setDown(self, blipdown):

        blip = self

        while blip.down is not None:

            blip = blip.down

        blip.down = blipdown

    def setError(self, bliperror):

        blip = self

        while blip.error is not None:

            blip = blip.error

        blip.error = bliperror
    
    def copy(self):

        return self.assign(self.__class__())

    def assign(self, copy):

        copy.id = self.id

        if self.next is not None:

            copy.next = self.next.copy()

        if self.error is not None:

            copy.error = self.error.copy()

        if self.down is not None:

            copy.down = self.down.copy()

        return copy

    def __str__(self):

        return str(self.id) + str(self.next) + str(self.error) + str(self.down) + ";"

    def callerr(self, solve):

        if self.error is None:

            return solve.error()

        else:

            return self.error.solve(solve)        

    def deepsolve(self, solve):

        return solve

    def solve(self, solve):

        error("solve")

        ret = self.deepsolve(solve)

        if solve.err is False and self.down is not None:

            ret = self.down.solve(solve)

        if ret.err is False and self.next is not None:

            ret = self.next.solve(solve.setFlag(ret.flag))

        if ret.err is False or self.error is None:

            return ret
        
        return self.error.solve(solve.setFlag(ret.flag))

class AryBlip(Blip):

    blips = []

    def __str__(self):
        
        ret = "ary"

        for blip in self.blips:

            ret += str(blip)

        return ret + "." + Blip.__str__(self)

    def deepsolve(self, solve):

        ary = []

        arysolve = solve.copy()
        for blip in self.blips:

            sub = blip.solve(arysolve.copy())
            arysolve.setFlag(sub.flag)

            if sub.err:

                return self.callerr(solve.setFlag(arysolve.flag))

            ary.append(sub.string)
            arysolve.startidx = sub.retidx

        return Solve(ary, arysolve.flag, arysolve.startidx)

class IdxBlip(Blip):

    def __str__(self):

        return "idx" + Blip.__str__(self)
    
    def deepsolve(self, solve):

        return Solve(solve.startidx, solve.flag, solve.startidx)

class EndBlip(Blip):

    def __str__(self):

        return "end" + Blip.__str__(self)
    
    def deepsolve(self, solve):
        
        if len(solve.string) <= solve.startidx:

            return Solve("", solve.flag, solve.startidx)

        else:

            return solve.error()

class ErrBlip(Blip):

    def __str__(self):

        return "err" + Blip.__str__(self)

    def deepsolve(self, solve):

        return solve.error()

class NxtBlip(Blip):

    def __str__(self):

        return "nxt" + Blip.__str__(self)

    def deepsolve(self, solve):

        if len(solve.string) <= solve.startidx:

            return solve.error()

        return Solve(solve.string[solve.startidx], solve.flag, solve.startidx + 1)

class RecBlip(Blip):

    def __init__(self, bid):
        
        Blip.__init__(self)
        self.id = bid
        self.copies = [self]

    def __str__(self):

        return "rec" + str(self.id) + str(self.next) + str(self.error) + str(self.down) + ";"
    
    def copy(self):

        copy = self.assign(RecBlip(self.id))
        copy.copies = self.copies
        self.copies.append(copy)
        return copy

    def deepsolve(self, solve):

        error("rec deepsolve")

class InsideBlip(Blip):

    def __init__(self, inside):
        Blip.__init__(self)

        self.inside = inside

    def __str__(self):

        return "inside" + str(self.inside) + Blip.__str__(self)

    def copy(self):

        return self.assign(self.__class__(self.inside.copy()))

class RepBlip(InsideBlip):

    def __init__(self, inside, low, high):
        InsideBlip.__init__(self, inside)

        self.low = low
        self.high = high

    def __str__(self):

        return "rep" + str(self.low) + "," + str(self.high) + InsideBlip.__str__(self)

    def copy(self):

        return self.assign(RepBlip(None, self.low, self.high))

    def deepsolve(self, solve):

        ary = []
        arysolve = solve.copy()

        while True:

            sub = self.inside.solve(arysolve.copy())
            arysolve.setFlag(sub.flag)

            if sub.retidx == arysolve.startidx or sub.err:

                break
            
            ary.append(sub.string)
            arysolve.startidx = sub.retidx

        size = len(ary)
        if self.low <= size and size < self.high:

            return Solve(ary, arysolve.flag, arysolve.startidx)

        return solve.setFlag(arysolve.flag).error()

class SumBlip(InsideBlip):

    def __str__(self):

        return "sum" + InsideBlip.__str__(self)

    def deepsolve(self, solve):

        sub = self.inside.solve(solve.copy())

        if sub.err:

            return sub

        ret = ""

        for substring in sub.string:

            ret += substring

        return Solve(ret, sub.flag, sub.retidx)
     
class CatBlip(InsideBlip):

    def __str__(self):

        return "cat" + InsideBlip.__str__(self)

    def deepsolve(self, solve):

        sub = self.inside.solve(solve.copy())

        if sub.err:

            return sub

        ret = []

        for substring in sub.string:

            ret += substring

        return Solve(ret, sub.flag, sub.retidx)
    
class NotBlip(InsideBlip):

    def __str__(self):

        return "not" + InsideBlip.__str__(self)

    def deepsolve(self, solve):

        startidx = solve.startidx
        sub = self.inside.solve(solve)
        ret = Solve("", sub.flag, startidx)

        if sub.err:

            return ret
        
        return ret.error()

class IntBlip(InsideBlip):

    def __str__(self):

        return "int" + InsideBlip.__str__(self)
    
    def deepsolve(self, solve):

        sub = self.inside.solve(solve)

        if sub.err:

            return sub

        return Solve(int(sub.string), sub.flag, sub.retidx)

class StrBlip(InsideBlip):

    def __str__(self):

        return "str" + InsideBlip.__str__(self)

    def deepsolve(self, solve):

        sub = self.inside.solve(solve)

        if sub.err:

            return sub

        return Solve(str(sub.string), sub.flag, sub.retidx)

class CmpBlip(Blip):

    def __init__(self):
        Blip.__init__(self)

        self.cmp = {}

    def __str__(self):

        return "cmp" + str(self.cmp) + Blip.__str__(self)
    
    def setError(self, bliperror):

        if isinstance(bliperror, CmpBlip):

            self.cmp = self.mergeCmp(self.cmp, bliperror.cmp)

        else:

            Blip.setError(self, bliperror)
    
    def mergeCmp(self, a, b):

        if a == True or b == True:
            return True

        if a is None:
            a = {}

        if b is None:
            b = {}

        c = {}
        for i in a:
            c[i] = self.mergeCmp(a[i], b.get(i))

        for i in b:
            if c.get(i) is None:
                c[i] = self.mergeCmp(a.get(i), b[i])

        return c

    def copy(self):

        copy = CmpBlip()
        copy.cmp = Copy.deepcopy(self.cmp)
        return self.assign(copy)

    def deepsolve(self, solve):

        cmpmap = self.cmp
        string = ""
        startidx = solve.startidx

        while startidx < len(solve.string):

            label = solve.string[startidx]
            cmpmap = cmpmap.get(label)

            if cmpmap is None:

                break

            string += label
            startidx += 1

            if cmpmap.get("__ENDCMP__") is True:

                ret = Solve(string, solve.flag, startidx)
        
        if ret is None:

            return solve.error()

        return ret

class SubBlip(Blip):

    def __init__(self, path):
        Blip.__init__(self)

        self.path = path

    def __str__(self):
        
        return "sub" + str(self.path) + Blip.__str__(self)

    def copy(self):

        return self.assign(SubBlip(self.path))
    
    def deepsolve(self, solve):

        string = solve.string

        for label in solve.path:

            try:
                
                string = string[label]

            except:
                
                return solve.error()

        return Solve(string, solve.flag, solve.startidx)

class TxtBlip(Blip):

    def __init__(self, txt):
        Blip.__init__(self)

        self.txt = txt

    def __str__(self):
        
        return "txt" + self.txt + Blip.__str__(self)

    def copy(self):

        return self.assign(TxtBlip(self.txt))

    def deepsolve(self, solve):

        return Solve(self.txt, solve.flag, solve.startidx)

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

        ret = self.snipBlip(snips[0], args)
        ret.setError(self.snipBlip(snips[2], args))

        ret.setNext(self.snipBlip(snips[1], args))

        return ret

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

        return SubBlip(snips)

    def snip_txt(self, snips, args):

        return TxtBlip(snips[0])

    def __init__(self, startname, snipmap):

        self.snipmap = snipmap
        self.blipmap = {}
        self.bidmap = {}
        self.bidlist = []

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
            "txt": self.snip_txt
        }

        self.blip = self.snipBlip(self.snipmap[startname], [])

    def snipSwitch(self, tok, snips, args):

        label = str([tok] + [snips] + [args])
        blip = self.blipmap.get(label)

        if blip is None:

            blip = RecBlip(len(self.bidlist))
            self.bidlist.append(blip)
            self.bidmap[str(blip)] = blip.id

            self.blipmap[label] = blip
            nextblip = self.snipfuns[tok](snips, args)
            self.blipmap[label] = nextblip
            self.bidlist[blip.id] = nextblip

            if nextblip.id is None:

                nextlabel = str(nextblip)
                nextblip.id = self.bidmap.get(nextlabel)

                if nextblip.id is None:

                    self.bidmap[nextlabel] = blip.id
                    nextblip.id = blip.id
    
            for copy in blip.copies:
                
                copy.id = nextblip.id
                copy.inside = nextblip

            return nextblip.copy()

        return blip.copy()

    def snipBlip(self, snip, args):

        if isinstance(snip, str) is False:

            return self.snipSwitch(snip[0], snip[1:], args)

        snipfun = self.snipfuns.get(snip)
        if snipfun is not None:

            return snipfun([], args)

        mappedsnip = self.snipmap.get(snip)
        if mappedsnip is not None:

            return self.snipSwitch(mappedsnip, [], args)
        
        return self.snipSwitch("txt", [snip], args)


def Parser(startname, snipmap):

    solve = ParserMaker(startname, snipmap).blip.solve

    def ret(string):

        return solve(Solve(string, False, 0))

    return ret

test = Parser("a", {
    "a": [
        "or",
        ["ary",["mch","a"],["cmp","b"]],
        ["cmp","c"],
        ["cmp","ender","end"]
    ]
})

test("cbbb")

    
print("test")