/*************************\
    Epoxy Token Classes
\*************************/

class InternalToken {
	constructor(Name,Literal,Type,Extra={}){
		this.Name=Name,this.Literal=Literal,this.Type=Type;
		for(let Name in Extra)
			this[Name]=Extra[Name];
		this.Extras=Object.keys(Extras);
	}
	equals(Token){
		return Token.Name===this.Name&&Token.Type===this.Type;	
	}
	isType(Type){
		return this.Type===Type;	
	}
	is(Name,Type){
		return Name===this.Name&&Type===this.Type;
	}
}

class BaseToken extends InternalToken {
	constructor(...Arguments){
		super(...Arguments);
		this.Index=0,this.Line=0;
	}
}

/*************************\
     Epoxy Token Types
\*************************/

const Types = "Keyword Identifier Whitespace Operator Bracket Constant String Number Boolean Null".split(" ");

/*************************\
       Epoxy Tokens
\*************************/

const RawTokens = [
	//Keyword Tokens
	new InternalToken("VAR","var",Types[0]),
	new InternalToken("FUNCTION","fn",Types[0]),
	new InternalToken("CLOSE","cls",Types[0]),
	new InternalToken("RETURN","return",Types[0]),
	new InternalToken("LOOP","loop",Types[0]),
	new InternalToken("OF","of",Types[0]),
	new InternalToken("AS","as",Types[0]),
	new InternalToken("IN","in",Types[0]),
	new InternalToken("WHILE","while",Types[0]),
	new InternalToken("IF","if",Types[0]),
	new InternalToken("ELSE","else",Types[0]),
	new InternalToken("ELSEIF","elseif",Types[0]),
	new InternalToken("VAR","vr",Types[0]),
	new InternalToken("VAR","vr",Types[0]),
	new InternalToken("VAR","vr",Types[0]),
	new InternalToken("VAR","vr",Types[0]),
	//Whitespace Tokens
	new InternalToken("SPACE",String.fromCharCode(32),Types[2]),
	new InternalToken("TAB",String.fromCharCode(9),Types[2]),
	new InternalToken("NOBREAKSPACE",String.fromCharCode(160),Types[2]),
	new InternalToken("OGHAMSPACE",String.fromCharCode(5760),Types[2]),
	new InternalToken("ENQUAD",String.fromCharCode(8192),Types[2]),
	new InternalToken("EMQUAD",String.fromCharCode(8193),Types[2]),
	new InternalToken("ENSPACE",String.fromCharCode(8194),Types[2]),
	new InternalToken("EMSPACE",String.fromCharCode(8195),Types[2]),
	new InternalToken("THREEPEMSPACE",String.fromCharCode(8196),Types[2]),
	new InternalToken("FOURPEMSPACE",String.fromCharCode(8197),Types[2]),
	new InternalToken("SIXPEMSPACE",String.fromCharCode(8198),Types[2]),
	new InternalToken("FIGURESPACE",String.fromCharCode(8199),Types[2]),
	new InternalToken("PUNCSPACE",String.fromCharCode(8200),Types[2]),
	new InternalToken("THINSPACE",String.fromCharCode(8201),Types[2]),
	new InternalToken("HAIRSPACE",String.fromCharCode(8202),Types[2]),
	new InternalToken("NARROWNOBREAKSPACE",String.fromCharCode(8239),Types[2]),
	new InternalToken("MEDMATHSPACE",String.fromCharCode(8287),Types[2]),
	new InternalToken("IDEOSPACE",String.fromCharCode(12288),Types[2]),
	new InternalToken("LINEFEED",String.fromCharCode(10),Types[2],{LineBreak:true}),
	new InternalToken("LINETAB",String.fromCharCode(11),Types[2],{LineBreak:true}),
	new InternalToken("FORMFEED",String.fromCharCode(12),Types[2],{LineBreak:true}),
	new InternalToken("CRETURN",String.fromCharCode(13),Types[2],{LineBreak:true}),
	new InternalToken("NEXTLINE",String.fromCharCode(133),Types[2],{LineBreak:true}),
	new InternalToken("LINESEP",String.fromCharCode(8232),Types[2],{LineBreak:true}),
	new InternalToken("PARASEP",String.fromCharCode(8233),Types[2],{LineBreak:true}),
	//Operator Tokens
	new InternalToken("COLON",":",Types[3]),
	new InternalToken("ADD","+",Types[3]),
	new InternalToken("SUB","-",Types[3]),
	new InternalToken("MUL","*",Types[3]),
	new InternalToken("DIV","/",Types[3]),
	new InternalToken("MOD","%",Types[3]),
	new InternalToken("POW","^",Types[3]),
	new InternalToken("DOT",".",Types[3]),
	new InternalToken("COMMENT","--",Types[3]),
	new InternalToken("AND","&&",Types[3]),
	new InternalToken("OR","||",Types[3]),
	new InternalToken("NOT","!",Types[3]),
	new InternalToken("EQ","==",Types[3]),
	new InternalToken("LT","<",Types[3]),
	new InternalToken("GT",">",Types[3]),
	new InternalToken("LEQ","<=",Types[3]),
	new InternalToken("GEQ",">=",Types[3]),
	new InternalToken("NEQ","!=",Types[3]),
	//Bracket Tokens
	new InternalToken("CURLYOPEN","{",Types[4]),
	new InternalToken("CURLYCLOSE","}",Types[4]),
	new InternalToken("SQUAREOPEN","[",Types[4]),
	new InternalToken("SQUARECLOSE","]",Types[4]),
	new InternalToken("PARENOPEN","(",Types[4]),
	new InternalToken("PARENCLOSE",")",Types[4]),
	//String Tokens
	new InternalToken("QUOTE","\"",Types[6]),
	new InternalToken("APOS","'",Types[6]),
	//Boolean Tokens
	new InternalToken("TRUE","true",Types[8]),
	new InternalToken("FALSE","false",Types[8]),
	//Null Tokens
	new InternalToken("NULL","null",Types[9]),
];

const Tokens = {
	__Tokens:{},
	GetFromName:function(Name,Type){
		let _T=this.__Tokens;
		for(let TN in _T)
			if(TN===Name&&Type===_T[TN].Type)return _T[TN];
	},
	GetFromLiteral:function(Literal,Type){
		let _T=this.__Tokens;
		for(let Name in _T){
			let T = _T[Name];
			if(Literal===T.Literal&&Type===T.Type)return T;
		}
	},
	GetFromRawLiteral:function(Literal){
		let _T=this.__Tokens;
		for(let Name in _T){
			let T = _T[Name];
			if(Literal===T.Literal)return T;
		}
	},
	GetTypeFromName:function(Name){
		let _T=this.__Tokens[Name];
		for(let TN in _T)
			if(Name===TN)return _T[TN].Type;
		return Types[1];
	},
};
for(let IT of RawTokens)
	Tokens.__Tokens[IT.Name]=IT;


/*************************\
          Exports
\*************************/

export {Tokens,InternalToken,BaseToken,Types as TokenTypes};
