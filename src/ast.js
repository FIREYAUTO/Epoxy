/*************************\
          Imports
\*************************/
 
import {Chunks as ASTChunks,Expressions as ASTExpressions,ComplexExpressions as ASTComplexExpressions} from "https://fireyauto.github.io/Epoxy/src/asttypes.js";
import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {Tokens as _Tokens} from "https://fireyauto.github.io/Epoxy/src/tokens.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/src/astclasses.js";

class ASTExpression {
	constructor(Value,Priority=-1){
			this.Value=Value,this.Priority=Priority;
	}
}

/*************************\
         AST Stack
\*************************/

class ASTStack {
	//{{ Constructor }}\\
	constructor(TokenizerStack){
		this.TokenizerStack=TokenizerStack,
			this.Tokens=TokenizerStack.Result,
			this.Position=0,
			this.Token=this.Tokens[0],
			this.Line=this.Token?this.Token.Line:0,
			this.Index=this.Token?this.Token.Index:0,
			this.Result=this.NewBlock("Chunk"),
			this.Chunk=this.Result,
			this.OpenChunks=[];
	}
	//{{ AST Classes }}\\
	NewNode(Type){
		return new ASTNode(this,Type);	
	}
	NewBlock(Type){
		return new ASTBlock(this,Type);	
	}
	//{{ Chunk Handling }}\\
	OpenChunk(){
		this.OpenChunks.push(this.Chunk);
		this.Chunk = this.NewBlock("Chunk");
		return this.Chunk;
	}
	ChunkWrite(Value){
		this.Chunk.Write(Value);	
	}
	CloseChunk(){
		if(this.OpenChunks.length>0){
			let Previous=this.Chunk;
			this.Chunk=this.OpenChunks.pop();
			this.Chunk.Write(Previous);
		}
	}
	//{{ Control Methods }}\\
	Next(Amount=1){
		this.Position+=Amount;
		this.Token=this.Tokens[this.Position];
		return this.Token;
	}
	IsEnd(){
		return this.Position>=this.Tokens.length;
	}
	//{{ Token Naming Methods }}\\
	GetFT(Options={}){
		if(this.IsEnd())return "end of script";
		let Type = Options.Type||Options.Token.Type,
			Literal = Options.Literal||Options.Token.Literal,
			Name = Options.Name||Options.Token.Name;
		if(Type==="Constant")Type=Name.toLowerCase();
		let Text=[];
		if(Options.UseType)Text.push(Type.toLowerCase());
		if(Options.UseLiteral)Text.push(Literal);
		return Text.join(" ");
	}
	//{{ Token Checking Methods }}\\
	Check(Token,Name,Type){
		if(!Token)return false;
		return Token.is(Name,Type);
	}
	TypeCheck(Token,Type){
		if(!Token)return false;
		return Token.isType(Type);
	}
	CheckNext(Name,Type){
		if(!this.Token)return false;
		let Next=this.Next();
		this.Next(-1);
		if(!Next)return false;
		return this.Check(Next,Name,Type)
	}
	TypeCheckNext(Type){
		if(!this.Token)return false;
		let Next=this.Next();
		this.Next(-1);
		if(!Next)return false;
		return this.TypeCheck(Next,Type);
	}
	ErrorIfEOS(Type=""){
		if(this.IsEnd())ErrorHandler.ASTError(this,"Unexpected",["end of script"+Type]);
	}
	Test(Token,Name,Type){
		if(!this.Check(Token,Name,Type)){
			let T = _Tokens.GetFromName(Name,Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:Type,Name:Name,Literal:T?T.Literal:Name}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	TypeTest(Token,Type){
		if(!this.TypeCheck(Token,Type)){
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:false,Type:Type}),this.GetFT({UseType:true,UseLiteral:false,Token:this.Token})]);
		}
	}
	TestNext(Name,Type){
		if(!this.CheckNext(Name,Type)){
			this.Next();
			let T = _Tokens.GetFromName(Name,Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:Type,Name:Name,Literal:T?T.Literal:Name}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	TypeTestNext(Type){
		if(!this.TypeCheckNext(Type)){
			this.Next();
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:false,Type:Type}),this.GetFT({UseType:true,UseLiteral:false,Token:this.Token})]);
		}
	}
	//{{ Expressional Parsing Methods }}\\
	ASTExpression(...Arguments){
		return new ASTExpression(...Arguments);	
	}
	ParseComplexExpression(Expression,AllowList=[],Type="complex expression"){
		if(!(Expression instanceof ASTExpression))return Expression;
		let Priority=Expression.Priority,
			Next=this.Tokens[this.Position+1],
			Current=this.Token;
		if(!Next)return  Expression.Value;
		if(Next.is("LINEEND","Operator"))return Expression.Value;
		if(Next.isType("Identifier")&&Current.isType("Identifier"))ErrorHandler.ASTError(this,"Unexpected",[`identifier while parsing ${Type}`]);
		let Allowed=AllowList.length>0,
			Passed=false;
		if(Allowed){
			for(let Allow of AllowList){
				if(Next.is(...Allow)){
					Passed=true;
					break;
				}
			}
			if(!Passed)return ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseValue:true,Token:Next})} while parsing ${Type}`]);
		}
		for(let ComplexExpression of ASTComplexExpressions){
			if(!Next.is(ComplexExpression.Name,ComplexExpression.Type))continue;
			if(Expression.Priority<=ComplexExpression.Priority){
				Expression = ComplexExpression.Call.bind(this)(Expression.Value,ComplexExpression.Priority,AllowList,Type);
				Expression.Priority = Priority;
				if(ComplexExpression.Stop===true)break;
				let Result=this.ParseComplexExpression(Expression,AllowList,Type);
				return Result;
			}
		}
		return Expression.Value;
	}
	ParseExpression(Priority=-1,AllowList,Type,EAllowList=[],EType="expression"){
		this.ErrorIfEOS();
		let Token=this.Token,
			Result=undefined;
		let Allowed=EAllowList.length>0;
		for(let Expression of ASTExpressions){
			let Do=false,TY="Value";
			if(Expression.Name)Do=Token.is(Expression.Name,Expression.Type),TY="Value";
			else Do=Token.isType(Expression.Type),TY="Type";
			if(Do){
				if(Allowed){
					let Passed=false;
					for(let Allow of EAllowList){
						if(TY==="Value"&&Allow.length==2)Passed=Token.is(...Allow);
						else if(TY==="Type"&&Allow.length==1) Passed=Token.isType(...Allow);
						if(Passed)break;
					}
					if(!Passed)return ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseValue:true,Token:Token})} while parsing ${EType}`]);
				}
				let Exp = Expression.Call.bind(this)(Priority,AllowList,Type);
				Result = Exp.Value;
				Priority = Exp.Priority;
				if(Expression.Stop===true)return Result;
				break;
			}
		}
		if(Result===undefined)ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:Token})} while parsing expression`]);
		Result = this.ParseComplexExpression(new ASTExpression(Result,Priority),AllowList,Type);
		return Result;
	}
	ExpressionList(Priority,AllowList,Type,End,EAllowList,EType){
		let List=[];
		do {
			List.push(this.ParseExpression(Priority,AllowList,Type,EAllowList,EType));
			if(this.CheckNext("COMMA","Operator")){
				this.Next(2);
				if(End&&this.Token&&this.Token.is(End.Name,End.Type)){
					End.Stopped=true;
					break;
				}
				continue;
			}
			break;
		}while(true);
		return List;
	}
	ExpressionListInside(Start,End,Priority,AllowList,Type,EAllowList,EType){
		if(this.Token.is(Start.Name,Start.Type)){
			this.Next();
			this.ErrorIfEOS(" while parsing expression list");
			if(this.Token.is(End.Name,End.Type))return[];
			let List = this.ExpressionList(Priority,AllowList,Type,End,EAllowList,EType);
			if(!End.Stopped)this.TestNext(End.Name,End.Type),this.Next();
			return List;
		}else{
			let T = _Tokens.GetFromName(Start.Name,Start.Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:Type,Name:Name,Literal:T?T.Literal:Name}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	ExpressionInside(Start,End,Priority,AllowList,Type,EAllowList,EType){
		if(this.Token.is(Start.Name,Start.Type)){
			this.Next();
			this.ErrorIfEOS(" while parsing expression");
			if(this.Token.is(End.Name,End.Type))return;
			let Result = this.ExpressionList(Priority,AllowList,Type,End,EAllowList,EType);
			this.TestNext(End.Name,End.Type);
			this.Next();
			return Result;
		}else{
			let T = _Tokens.GetFromName(Start.Name,Start.Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:Type,Name:Name,Literal:T?T.Literal:Name}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	//{{ Identifier Parsing Methods }}\\
	IdentifierList(Options){
		let List = [];
		do{
			let Identifier = {
				Name:undefined,
				Value:undefined,
				Line:this.Token.Line,
				Index:this.Token.Index,
				Pointer:undefined,
			}
			if(Options.AllowPointer){
				this.Test(this.Token,"POPEN","Bracket");
				this.Next();
				this.TypeTest(this.Token,"Identifier");
				Identifier.Pointer = this.Token.Name;
				this.TestNext("PCLOSE","Bracket");
			}
			this.TypeTest(this.Token,"Identifier");
			Identifier.Name = this.Token.Name;
			if(Options.AllowDefault){
				if(this.CheckNext("COLON","Operator")){
					this.Next(2);
					Identifier.Value = this.ParseExpression(Options.Priority,Options.AllowList,Options.Type,Options.EAllowList,Options.EType);
				}
			}
			List.push(Identifier);
			if(this.CheckNext("COMMA","Operator")){
				this.Next(2);
				continue;
			}
			break;
		}while(true);
		return List;
	}
	//{{ Chunk Parsing Methods }}\\
	ParseBlock(Type=" while parsing chunk"){
		let Token=this.Token,
			Block=this.OpenChunk();
		this.Test(Token,"COLON","Operator");
		this.Next();
		this.ErrorIfEOS(Type);
		while(!this.Token.is("CLOSE","Keyword")){
			this.ParseChunk();
			this.Next();
			this.ErrorIfEOS(Type);
		}
		this.Chunk = this.OpenChunks.pop();
		return Block;
	}
	SkipLineEnd(){
		if(this.CheckNext("LINEEND","Operator"))this.Next();	
	}
	ParseChunk(){
		let Token=this.Token;
		for(let Chunk of ASTChunks){
			if(Token.is(Chunk.Name,Chunk.Type)){
				let Result = Chunk.Call.bind(this)();
				this.SkipLineEnd();
				this.ChunkWrite(Result);
				return;
			}
		}
		let Result = this.ParseExpression(-1,[["OF","Keyword"],["AS","Keyword"],["IN","Keyword"],["COLON","Operator"]],undefined,[["Identifier"],["POPEN","Bracket"]]);
		if(Result===undefined)ErrorHandler.ASTError(this,"Unexpected",this.GetFT({UseType:true,UseLiteral:true,Token:this.Token}));
		this.ChunkWrite(Result);
	}
	Parse(){
		while(!this.IsEnd())
			this.ParseChunk(),this.Next();
	}
}

/*************************\
            AST
\*************************/

const AST = {
	New:function(TokenizerStack){
		return new ASTStack(TokenizerStack);
	},
}

/*************************\
          Exports
\*************************/

export {ASTStack,AST};
