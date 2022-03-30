/*************************\
       Error Types
\*************************/

const ErrorTypes = {
	"ExpectedGot":(a,b)=>`Expected ${a}, got ${b} instead`,
	"Expected":a=>`Expected ${a}`,
	"Unexpected":a=>`Unexpected ${a}`,
	"Attempt":a=>`Attempt to ${a}`,
	"Cannot":a=>`Cannot ${a}`,
	"Invalid":a=>`Invalid ${a}`,
	"Malformed":a=>`Malformed ${a}`,
};

const EPXErrorName = "EpoxyError";
class EPXError extends Error{constructor(Message){super(Message).name=EPXErrorName}}

const ErrorHandler = {
	ThrowError:function(Type,Start="",Arguments=[]){
		let Call = ErrorTypes[Type];
		if(!Call)return;
		throw new EPXError(`${Start}${Call(...Arguments)}`);
	},
	DefaultError:function(Line,Index,Type,Arguments){
		return this.ThrowError(Type,`[Epoxy Error {${Line}:${Index}}]: `,Arguments);
	},
	TokenizerError:function(Token,Type,Arguments){
		return this.DefaultError(Token.Line,Token.Index,Type,Arguments);	
	},
	ASTError:function(Stack,Type,Arguments){
		return this.DefaultError(Stack.Line,Stack.Index,Type,Arguments);	
	},
	InterpreterError:function(Item,Type,Arguments){
		return this.DefaultError(Item.Line,Item.Index,Type,Arguments);	
	},
};

/*************************\
          Exports
\*************************/

export {ErrorHandler};
