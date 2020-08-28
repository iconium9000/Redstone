class ParserMaker:

    class Blip:

        def __init__(self):

            self.next = None
            self.error = None
            self.down = None

            self.tok = None
            self.args = []

        def __str__(self):

            return "string"

        def setBlip(self, blip):

            pass # TODO

        def clearNext(self):

            pass # TODO

        def setNext(self, blipnext):

            return blipnext # TODO

        def setDown(self, blipdown):

            return blipdown # TODO

        def setError(self, bliperror):

            return bliperror # TODO
        
        def copy(self):

            return self

    def getBlip(self, blip):

        label = str(blip)
        blipid = self.blipmap.get(label)

        if blipid is None:

            blipid = len(self.bliplist)
            blip.id = blipid
            self.bliplist.append(blip)
            self.blipmap[label] = blipid

            return blip.copy()

        else:

            return self.bliplist[blipid].copy()
    
    def tokBlip(self, tok):

        blip = self.Blip()
        blip.tok = tok
        
        return self.getBlip(blip)

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

        # TODO snips [snip]
        # TODO snips [snip, len]
        # TODO snips [snip, min, max]

        ret = self.tokBlip("newary")

        repblip = self.snipBlip(snips[0], args)
        repblip.setError(self.tokBlip("endary"))
        repblip.setDown(self.tokBlip("pushary"))
        repblip.setNext(repblip)

        ret.setNext(repblip)

        return ret

    def __init__(self, startname, snipmap):

        self.snipmap = snipmap
        self.blipmap = {}
        self.bliplist = []

        self.snipfuns = {
            "f": self.snip_f,
            "if": self.snip_if,
            "or": self.snip_or,
            "and": self.snip_and,
        }

        self.blipid = self.snipBlip(self.snipmap[startname], [])

    def snipswitch(self, tok, snips, args):

        return self.Blip() # TODO

    def snipBlip(self, snip, args):

        return self.Blip() # TODO

def Parser(startname, snipmap):

    pm = ParserMaker(startname, snipmap)

    return ["test"]


test = Parser("start", {
    "start": ["f", ["cmp","hello"]]
})

    
print("test")