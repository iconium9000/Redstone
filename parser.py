import copy as Copy

def error(errorName):

    raise NameError(errorName)

class Blip:

    def __init__(self):

        self.id = None
        self.static = False
        self.next = None
        self.error = None
        self.inside = None
        self.down = None

    def resetNext(self, blipnext):

        self.static = True

        if self.error is not None:

            self.error.resetNext(blipnext)

        if self.next is None:

            self.next = blipnext

        else:

            self.next.resetNext(blipnext)

    def setNext(self, blipnext):

        if self.error is not None:

            self.error.setNext(blipnext)

        if self.next is None:

            self.next = blipnext

        else:

            self.next.setNext(blipnext)

    def setDown(self, blipdown):

        if self.down is None:

            self.down = blipdown
        
        else:

            self.down.setDown(blipdown)

    def setError(self, bliperror):

        if self.error is None:

            self.error = bliperror

        else:

            self.error.setError(bliperror)
    
    def copy(self):

        return self.assign(self.__class__())

    def assign(self, copy):

        copy.static = self.static

        if self.next is not None:

            copy.next = self.next.copy()

        if self.error is not None:

            copy.error = self.error.copy()

        if self.inside is not None:

            copy.inside = self.inside.copy()

        if self.down is not None:

            copy.down = self.down.copy()

        return copy

    def setId(self, pm):

        error("setId")

    def __str__(self):

        error("str")

        return "str"

class AryBlip(Blip):

    blips = []

class IdxBlip(Blip):

    def test(self):

        pass

class EndBlip(Blip):

    def test(self):

        pass

class ErrBlip(Blip):

    def test(self):

        pass

class NxtBlip(Blip):

    def test(self):

        pass

class RecBlip(Blip):

    def __init__(self, label):
        Blip.__init__(self)

        self.label = label
        self.inside = None

    def __str__(self):

        return str(["rec",self.label])
    
    def copy(self):

        return self.assign(RecBlip(self.label))

class RepBlip(Blip):

    def __init__(self, inside, low, high):
        Blip.__init__(self)

        self.inside = inside
        self.low = low
        self.high = high

    def copy(self):

        return self.assign(RepBlip(None, self.low, self.high))
        
class InsideBlip(Blip):

    def __init__(self, inside):
        Blip.__init__(self)

        self.inside = inside

    def copy(self):

        return self.assign(self.__class__(None))

class SumBlip(InsideBlip):

    def test(self):

        pass
     
class CatBlip(InsideBlip):

    def test(self):

        pass
    
class NotBlip(InsideBlip):

    def test(self):

        pass

class CmpBlip(Blip):

    def __init__(self):
        Blip.__init__(self)

        self.cmp = {}

    def copy(self):

        copy = CmpBlip()
        copy.cmp = Copy.deepcopy(self.cmp)
        return self.assign(copy)

class SubBlip(Blip):

    def __init__(self, path):
        Blip.__init__(self)

        self.path = path

    def copy(self):

        return self.assign(SubBlip(self.path))

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

            ret.resetNext(self.snipBlip(snip, args))

        return ret
    
    def snip_if(self, snips, args):

        ret = self.snipBlip(snips[0], args)
        ret.setError(self.snipBlip(snips[2], args))

        ret.resetNext(self.snipBlip(snips[1], args))

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

            "end": self.snip_err,
            "err": self.snip_err,
            "nxt": self.snip_nxt,
            "idx": self.snip_idx,

            "cmp": self.snip_cmp,
            "rng": self.snip_rng,

            "mch": self.snip_mch,
            "arg": self.snip_arg,
            "sub": self.snip_sub
        }

        blip = self.snipBlip(self.snipmap[startname], [])
        blip.setId(self)

    def snipSwitch(self, tok, snips, args):

        label = str([tok] + [snips] + [args])
        blip = self.blipmap.get(label)

        if blip is None:

            blip = RecBlip(label)
            self.blipmap[label] = blip
            nextblip = self.snipfuns[tok](snips, args)
            self.blipmap[label] = nextblip

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

    pm = ParserMaker(startname, snipmap)

    error(pm)

    return ["test"]


test = Parser("a", {
    "a": ["or",["ary",["mch","a"],["cmp","b"]],["cmp","c"]]
})

    
print("test")