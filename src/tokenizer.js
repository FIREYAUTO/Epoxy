/*************************\
          Imports
\*************************/

import {Tokens as EPXTokens, TokenTypes as EPXTokenTypes, InternalToken, BaseToken} from "https://fireyauto.github.io/Epoxy/src/tokens.js";
import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";

/*************************\
      Tokenizer Stack
\*************************/

class TokenizerStack {
	constructor(Code){
		this.Code=Code,
			this.Tokens=Code.split(""),
			this.Result=[],
			this.TokenIndex=0,
			this.TokenLine=0,
			this.Index=0,
			this.Token=this.Tokens[0];
	}
	Next(Amount=1){
		this.Index+=Amount;
		this.Token=this.Tokens[this.Index];
		if(!this.Token)this.Token=Tokenizer.EOSToken;
		return this.Token;
	}
	IsEnd(){
		return this.Index >= this.Tokens.length;
	}
	Write(Token){
		this.Result.push(Token);	
	}
	IsIdentifierCharacter(Character){
		return !!Character.match(/[A-Za-z0-9_]+/);	
	}
	Escape(Literal){
		if(!Literal)return Literal;
		return Literal.replace(/(\<|\>|\*|\(|\)|\{|\}|\[|\]|\||\=|\?|\&|\^|\$|\\|\+|\-|\.|\#)/g, "\\$&");	
	}
	ComputePossibleCharacter(Character){
		let PossibleMatches = [],
			Escape = this.Escape(Character),
			IsIdentifier = false,
			IdentifierLength = 0;
		if(this.IsIdentifierCharacter(Character)){
			let New = Character;
			while(!this.IsEnd()){
				let Next = this.Next();
				if(this.IsEnd())break;
				let EscapeNext = this.Escape(Next);
				if(!this.IsIdentifierCharacter(Next)){
                	this.Next(-1);
                	break;
                }
				New+=Next;
			}
			IsIdentifier=true,
				IdentifierLength=New.length,
				Character=New,
				Escape=this.Escape(New);
		}
		for(let Name in EPXTokens.__Tokens){
			let Token = EPXTokens.__Tokens[Name];
			if(Token.Literal.match(new RegExp(`^${Escape}`))){
				let Matches=0,
					Index=0,
					Length=Token.Literal.length;
				while(true){
					let Value = Token.Literal.substr(Index,1);
					if(Value===this.Tokens[this.Index+Index])Matches++;
					else break;
					Index++;
					if(Index>=Length)break;
				}
				if(Matches===Length){
					PossibleMatches.push(Token.Literal);
					Character=Token.Literal,
						Escape=this.Escape(Character);
				}
			}
		}
		if(PossibleMatches.length===0)PossibleMatches.push(Character);
		let PossibleMatch = PossibleMatches.sort().pop();
		if(!IsIdentifier||PossibleMatch.length!=IdentifierLength)
			this.Next((PossibleMatch.length-IdentifierLength)-1);
		return PossibleMatch;
	}
	ParseToken(Character){
		Character = this.ComputePossibleCharacter(Character);
		let RawToken = EPXTokens.GetFromRawLiteral(Character);
		let Token = new BaseToken(Character,Character,"Identifier");
		if(RawToken)
			Token.Name = RawToken.Name,
				Token.Literal = Character,
				Token.Type = RawToken.Type;
		if(Token.Type==="Whitespace"&&Token.LineBreak){
			this.TokenIndex=0,
				this.TokenLine++;
		}
		this.TokenIndex	+= Character.length;
		Token.Index=this.TokenIndex,
			Token.Line=this.TokenLine;
		return Token;
	}
	Parse(){
		while(!this.IsEnd()){
			let Token = this.ParseToken(this.Token);
			if(Token)this.Write(Token);
			this.Next();
		}
		this.Result=this.RemoveWhitespace(this.HandleTokenTypes(this.Result));
	}
	//Whitespace Remover
	RemoveWhitespace(Tokens){
		let Result=[];
		for(let Token of Tokens)if(Token.Type!="Whitespace")Result.push(Token);
		return Result;
	}
	//Token Type Handling
	ParseENumber(Stack,Value,AllowDecimal=true){
		if(Value.toLowerCase().endsWith("e")){
			Value=Value.substr(0,Value.length-1);
			if(isNaN(+Value))return[false,Value+"e"];
			let ESuffix = Stack.Next();
			Value+="e";
			if(ESuffix.is("ADD","Operator")||ESuffix.is("SUB","Operator"))
				Value+=ESuffix.Literal,
					ESuffix=Stack.Next();
			if(isNaN(+ESuffix.Literal))return[false,Value+ESuffix.Literal];
			Value+=ESuffix.Literal;
			return [true,Value];
		}else if(AllowDecimal){
			return this.ParseDecimal(Stack,Value);	
		}else{
        		if(!isNaN(+Value)){
            			return [true,Value];
			}
		}
		return [false,Value];
	}
	ParseDecimal(Stack,Value){
		let Next = Stack.Next();
		if(Next&&Next.is("DOT","Operator")){
			let Number = Stack.Next();
			let [Success,Result] = this.ParseENumber(Stack,Number.Literal,false);
			if(!Success)return[Success,Value+"."+Result];
			Value+="."+Result;
		}else{
        		Stack.Next(-1);
        	}
		if(isNaN(+Value))return[false,Value];
		return [true,Value];
	}
	ParseNumber(Stack,Token){
		let [Success,Result] = this.ParseENumber(Stack,Token.Literal);
		return [Success,Result];
	}
	ToNumber(Token,Value){
		Token.Type="Constant",
			Token.Name="Number",
			Token.Literal=Value;
	}
	EscapeStringLiteral(Literal){
		switch (Literal) {
			case "r": return "\r";
			case "n": return "\n";
			case "b": return "\b";
			case "t": return "\t";
			case "c": return "\c";
			case "f": return "\f";
			case "v": return "\v";
			default: return Literal;
		}	
	}
	CombineStringLiterals(Literals){
		let Result = "";
		for(let T of Literals){
			let L=T.Literal,
				Add=undefined;
			if(T.Escaped){
				if(L.length>1)Add=L.substr(1,L.length),L=L.substr(0,1);
				L=this.EscapeStringLiteral(L);
			}
			Result+=L;
			if(Add)Result+=Add;
		}
		return Result;
	}
	ParseTokenType(Stack,Token){
		if(Token.isType("Boolean")){
			Token.Type = "Constant",
				Token.Literal = Token.Name==="TRUE"?true:false,
				Token.Name = "Boolean";
		}else if(Token.isType("Null")){
			Token.Type = "Constant",
				Token.Literal = null,
				Token.Name = "Null";
		}else if(Token.isType("Identifier")){
			let [Success,Result] = this.ParseNumber(Stack,Token);
			if(Success){
				if(isNaN(+Result))return ErrorHandler.TokenizerError(Stack,"Malformed",[`number ${Result}`]);
				this.ToNumber(Token,+Result);
			}else{
				if(Result.match(/^[0-9]/))return ErrorHandler.TokenizerError(Stack,"Malformed",[`number ${Result}`]);
			}
		}else if(Token.isType("String")){
			let Result = undefined;
			if(Token.Name==="QUOTE")Result=this.CombineStringLiterals(this.GetBetween(Stack,T=>T.is("QUOTE",Token.Type),true,true));
			else if(Token.Name==="APOS")Result=this.CombineStringLiterals(this.GetBetween(Stack,T=>T.is("APOS",Token.Type),true,true));
			if(!(Result===undefined))Token.Type="Constant",Token.Name="String",Token.Literal=Result;
		}else if(Token.is("COMMENT","Operator")){
			this.GetBetween(Stack,T=>T.isType("Whitespace")&&T.LineBreak===true);	
		}
		return Token;
	}
	GetBetween(Stack,EndCheck,AllowEscapes=false,CheckEOS=false){
		let Result = [];
		while(!Stack.IsEnd()){
			let Token = Stack.Next();
			if(AllowEscapes&&Token.is("BACKSLASH","Control")){
				Token=Stack.Next();
				Token.Escaped===true;
				Result.push(Token);
				continue;
			}
			if(EndCheck(Token))break;
			Result.push(Token);
		}
		if(CheckEOS&&Stack.Token.is("EOS","None"))ErrorHandler.TokenizerError(Stack,"Unexpected",["end of script"]);
		return Result;
	}
	HandleTokenTypes(Tokens){
		let Stack={
			Position:0,
			Tokens:Tokens,
			Token:Tokens[0],
			IndeX:0,
			Line:0,
			Result:[],
			IsEnd:function(){return this.Position>=this.Tokens.length},
			Next:function(Amount=1){this.Position+=Amount;this.Token=this.Tokens[this.Position];if(this.Token)this.Index=this.Token.Index,this.Line=this.Token.Line;else this.Token=Tokenizer.EOSToken;return this.Token},
			Write:function(Token){this.Result.push(Token);return Token},
		};
		while(!Stack.IsEnd()){
			let Result = this.ParseTokenType(Stack,Stack.Token);
			if(Result)Stack.Write(Result);
			Stack.Next();
		}
		return Stack.Result;
	}
}

/*************************\
         Tokenizer
\*************************/

const Tokenizer = {
	New:function(...Arguments){
		return new TokenizerStack(...Arguments);
	},
	EOSToken:new InternalToken("EOS","<eos>","None"),
}

/*************************\
          Exports
\*************************/

export {Tokenizer,TokenizerStack};
