def error(errorName):

    raise NameError(errorName)

class Blip:

    def __init__(self):

        self.next = None
        self.error = None
        self.down = None
        self.inside = None

        # self.args = []

        # self.cmp = None
        # self.range = False
        # self.low = 0
        # self.high = 0

    def setInside(self, blip):

        error("setInside")

        pass # TODO

    def clearNext(self):

        error("clearNext")

        pass # TODO

    def setNext(self, blipnext):

        error("setNext")

        return blipnext # TODO

    def setDown(self, blipdown):

        error("setDown")

        return blipdown # TODO

    def setError(self, bliperror):

        error("setError")

        return bliperror # TODO
    
    def copy(self):

        error("copy")

        return self

class EmptyBlip(Blip):

    def __init__(self, tok):

        self.tok = tok

class InsideBlip(Blip):

    def __init__(self, inside):

        self.inside = inside

class repBlip(Blip):

    def __init__(self, inside):

        
class sumBlip(Blip):

    def __init__(self, inside):

        
class catBlip(Blip):

    def __init__(self, inside):

        
class notBlip(Blip):

    def test(self):

        pass

class CmpBlip(Blip):

    def __init__(self):

        self.cmp = {}

class SubBlip(Blip):

    def __init__(self, path):

        self.path = path

class ParserMaker:

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

            ret.clearNext()
            ret.setNext(self.snipBlip(snip, args))

        return ret
    
    def snip_if(self, snips, args):

        ret = self.snipBlip(snips[0], args)
        ret.setError(self.snipBlip(snips[2], args))

        ret.clearNext()
        ret.setNext(self.snipBlip(snips[1], args))

        return ret

    def snip_rep(self, snips, args):

        sniplen = len(snips)
        ret = InsideBlip("rep",self.snipBlip(snips[0], args))

        if sniplen == 2:

            self.range = True
            self.low = snips[1]
            self.high = snips[1]

        elif sniplen > 2:

            self.range = True
            self.low = snips[1]
            self.high = snips[2]
        
        return ret

    def snip_sum(self, snips, args):

        return InsideBlip("sum", self.snipBlip(snips[0], args))

    def snip_cat(self, snips, args):

        return InsideBlip("cat", self.snipBlip(snips[0], args))

    def snip_not(self, snips, args):

        return InsideBlip("not", self.snipBlip(snips[0], args))

    def snip_idx(self, snips, args):

        return EmptyBlip("idx")

    def snip_end(self, snips, args):

        return EmptyBlip("end")

    def snip_err(self, snips, args):

        return EmptyBlip("err")

    def snip_nxt(self, snips, args):

        return EmptyBlip("nxt")

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

        return self.snipBlip(snip[0], newargs)

    def snip_arg(self, snips, args):

        return args[snips[0]].copy()

    def snip_sub(self, snips, args):

        return SubBlip(snips)

    def __init__(self, startname, snipmap):

        self.snipmap = snipmap
        self.blipmap = {}
        self.bliplist = []

        self.snipfuns = {
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

        self.blipid = self.snipBlip(self.snipmap[startname], [])

    def snipSwitch(self, tok, snips, args):

        blip = self.snipfuns[tok](snips, args)
        label = str(blip)

        oldblip = self.blipmap.get(label)
        if oldblip is None:

            self.blipmap[label] = blip
            return blip
        
        return oldblip.copy()

    def snipBlip(self, snip, args):

        if isinstance(snip, str) is False:

            return self.snipSwitch(snip[0], snip[1:], args)

        snipfun = self.snipfuns.get(snip)
        if snipfun is not None:

            return snipfun([], args)

        mappedsnip = self.snipmap.get(snip)
        if mappedsnip is not None:

            return self.snipSwitch(mappedsnip, [], args)
        
        return self.snipSwitch("txt", [mappedsnip], args) 


def Parser(startname, snipmap):

    pm = ParserMaker(startname, snipmap)

    return ["test"]


test = Parser("start", {
    "start": ["f", ["cmp","hello"]]
})

    
print("test")