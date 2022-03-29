import {Tokens as EPXTokens, Types as EPXTokenTypes, InternalToken, BaseToken} from "/src/tokens.js";

class TokenizerStack {
	constructor(Code){
		this.Code=Code,
			this.Tokens=[],
			this.TokenIndex=0,
			this.TokenLine=0;
	}
	
}

const Tokenizer = {
	New:function(...Arguments){
		return new TokenizerStack(...Arguments);
	}
}
