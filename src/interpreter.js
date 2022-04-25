/*************************\
         Imports
\*************************/

import {EpoxyState} from "https://fireyauto.github.io/Epoxy/src/interpreterstate.js";
import {InterpreterStates} from "https://fireyauto.github.io/Epoxy/src/interpreterparsestates.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
    Default Environment
\*************************/

const DefaultEnvironment = {
	"_version":"Epoxy 1.1",
};

/*************************\
        Interpreter
\*************************/

const Interpreter = {
	New:function(ASTStack,Environment={}){
		return new InterpreterStack(ASTStack,Environment);
	},
	GetType:function(Value){
		let Type=typeof Value;
		if(Value instanceof Array)return"array";
		if(Value===null||Value===undefined)return"null";
		return Type;
	}
}

/*************************\
     Interpreter Stack
\*************************/

class UnpackState {
	constructor(List){
		this.List=List;
	}
}

class InterpreterStack {
	constructor(ASTStack,Environment){
		this.AStack=ASTStack,
			this.Tokens=ASTStack.Result,
			this.MainState=new EpoxyState(this.Tokens),
			this.Environment=Environment,
			this.Ended=false,
			this.EndedMessage="";
		for(let Name in DefaultEnvironment)
			if(!Object.prototype.hasOwnProperty.call(Environment,Name))
				Environment[Name]=DefaultEnvironment[Name];
		for(let Name in Environment)this.MainState.NewVariable(Name,Environment[Name]);
		this.States = {};
		for(let Name in InterpreterStates)this.States[Name]=InterpreterStates[Name].bind(this);
		this.UnpackStateClass = UnpackState;
	}
	UnpackState(...Arguments){
		return new UnpackState(...Arguments);
	}
	async Parse(State,Token,Unpack=false){
		this.HandleEnded();
		if(!(Token instanceof ASTBase))return Token===undefined?null:Token;
		let Result = undefined;
		for(let Name in this.States){
			let Call = this.States[Name];
			if(Token.Type===Name){Result=await Call(State,Token);break}
			else if(Token.Type==="Unpack"){
				if(Unpack===true){
					let List=await this.Parse(State,Token.Read("List"),true);
					Result=new UnpackState(List);
					break;
				}else ErrorHandler.InterpreterError(Token,"Unexpected",["unpacking operator"]);
			}
		}
		return Result===undefined?null:Result;
	}
	HandleEnded(){
		if(this.Ended)ErrorHandler.InterpreterError(this.MainState,"Halt",[this.EndedMessage]);	
	}
	Quit(Message){
		this.Ended=true,
			this.EndedMessage=Message;
	}
	async ParseState(State,Unpack=false,Proxy){
		let S1=State,
			S2=State;
		if(Proxy)S1=Proxy;
		this.HandleEnded();
		while(!S1.IsEnd()){
			let Result=await this.Parse(S2,S1.Token,Unpack);
			S1.Next();
			if(S2.Read("Returned")===true){
				S2.Write("InLoop",false);
				break;
			}
			if(S2.Read("Break")===true){
				S2.Write("InLoop",false);
				break;
			}
			if(S2.Read("Continue")===true)break;
			this.HandleEnded();
		}
		S1.Close();
	}
	async ParseArray(State,List){
		let Result=[];
		for(let k in List){
			let v=List[k],r=undefined;
			if(typeof v==="object"&&!(v instanceof ASTBase))r=await this.ParseArray(State,v);
			else r=await this.Parse(State,v,true);
			if(r instanceof UnpackState)for(let x of r.List)Result.push(x);
			else Result.push(r);
		}
		return Result;
	}
	async FunctionState(State,Token){
		let Parameters=Token.Read("Parameters"),
		    GlobalVariables=State.GetGlobalVariables(),
		    self=this,
		    Body=Token.Read("Body");
		const Callback = async function(Stack,CState,...Arguments){
			let NewState=new EpoxyState(Body,State,{IsFunction:true}),
				Stop=false,
				Args=[];
			NewState.NewVariable("this",Callback),
				NewState.NewVariable("arguments",Args)
			for(let Key in Parameters){
				let Parameter = Parameters[Key],
				    Argument = Arguments[Key];
				if(Parameter.Vararg===true){
					let K=+Key,List=[];
					for(let i=K;i<Arguments.length;i++)List.push(await self.Parse(State,Arguments[i]));
					Argument=List;
					if(Argument.length===0)Argument=undefined;
					Stop=true;
				}
				if(Argument===undefined)Argument=await self.Parse(State,Parameter.Value);
				NewState.NewVariable(Parameter.Name,Argument);
				Args.push(Argument);
				if(Stop)break;
			}
			for(let Variable of GlobalVariables)NewState.TransferVariable(Variable);
			await self.ParseState(NewState);
			let Returns = NewState.Read("Returns");
			if(!Returns)return null;
			if(Returns.length>1){
				return new UnpackState(Returns);
			}
			if(Returns[0]===undefined)Returns[0]=null;
			return Returns[0];
		}
		return Callback;
	}
	/*
	
	*/
}

/*************************\
          Exports
\*************************/

export {Interpreter,InterpreterStack};
