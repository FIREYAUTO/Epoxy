/*************************\
          Imports
\*************************/

import {Tokens as EPXTokens, Types as EPXTokenTypes, InternalToken, BaseToken} from "/src/tokens.js";

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
				let Next = this.Next(),
					EscapeNext = this.Escape(Next);
				if(!this.IsIdentifierCharacter(EscapeNext))break;
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
				while(!this.IsEnd()){
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
			this.Next(PossibleMatch.length-IdentifierLength);
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
	ParseNumber(Stack,Token){
		let Value = Token.Literal;
		if(isNaN(+Value))return [false];
		let Next = Stack.Next();
		if(Next.is("DOT","Operator")){
			let Number = Stack.Next();
			if(isNaN(+Number.Literal)){Stack.Next(-2);return [false]}
			Value+="."+Number.Literal;
		}else{
			Stack.Next(-1);
		}
		let ENext = Stack.Next();
		if(ENext.is("E","Identifier")||ENext.is("e","Identifier")){
			let ESuffix = Stack.Next(),
			    Amount = 2;
			if(ESuffix.is("ADD","Operator")||ESuffix.is("SUB","Operator"))
				Value+=ENext.Literal+ESuffix.Literal,
					ESuffix=Stack.Next(),
					Amount++;
			if(isNaN(+ESuffix.Literal)){Stack.Next(-Amount);return [false]}
			Value+=ESuffix.Literal;
		}
		return [true,+Value];
	},
	ToNumber(Token,Value){
		Token.Type="Constant",
			Token.Name="Number",
			Token.Literal=Value;
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
			if(Success)this.ToNumber(Token,Result);
		}
		return Token;
	},
	HandleTokenTypes(Tokens){
		let Stack={
			Index:0,
			Tokens:Tokens,
			Token:Tokens[0],
			Result:[],
			IsEnd:function(){return this.Index>=this.Tokens.length},
			Next:function(Amount=1){this.Index+=Amount;this.Token=this.Tokens[this.Index];return this.Token},
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

export {Tokenizer,TokenzierStack};
