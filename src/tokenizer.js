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
		let RawToken = EPXTokens.GetFromLiteral(Character);
		let Token = new BaseToken(Character,Character,"Identifier");
		if(RawToken){
			Token.Name = RawToken.Name,
				Token.Literal = Character,
				Token.Type = RawToken.Type;
		}
		return Token;
	}
	Parse(){
		while(!this.IsEnd()){
			let Token = this.ParseToken(this.Token);
			if(Token)this.Write(Token);
			this.Next();
		}
	}
}

/*************************\
         Tokenizer
\*************************/

const Tokenizer = {
	New:function(...Arguments){
		return new TokenizerStack(...Arguments);
	},
}

/*************************\
          Exports
\*************************/

export {Tokenizer,TokenzierStack};
