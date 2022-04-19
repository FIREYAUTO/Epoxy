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
	"Halt":a=>`Script halted, ${a}`,
};

class EPXError extends Error{constructor(Name,Message){super(Message).name=Name}}

const ErrorHandler = {
	ThrowError:function(Type,Name="",End="",Arguments=[]){
		let Call = ErrorTypes[Type];
		if(!Call)return;
		throw new EPXError(Name,Call(...Arguments)+End);
	},
	DefaultError:function(Line,Index,Type,Arguments){
		return this.ThrowError(Type,"[Epoxy Error]",` on line ${Line} at index ${Index}`,Arguments);
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
