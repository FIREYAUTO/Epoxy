/*************************\
          Imports
\*************************/

import {Tokenizer} from "https://fireyauto.github.io/Epoxy/src/tokenizer.js";
import {AST} from "https://fireyauto.github.io/Epoxy/src/ast.js";
import {Interpreter} from "https://fireyauto.github.io/Epoxy/src/interpreter.js";

/*************************\
       Main Function
\*************************/

async function Main(Code,Environment={}){
	let Result = {Success:false};
	try {
		let TStack = Tokenizer.New(Code);
		await TStack.Parse();
		let AStack = AST.New(TStack);
		await AStack.Parse();
		let IStack = Interpreter.New(AStack,Environment);
		Result.TStack=TStack,Result.AStack=AStack,Result.IStack=IStack;
		await IStack.ParseState(IStack.MainState);
		Result.Success = true;
	}catch(Error){
		Result.Success=false,
			Result.Error=Error;
	}
	return Result;
}

/*************************\
          Exports
\*************************/

export {Main as RunEpoxy};
