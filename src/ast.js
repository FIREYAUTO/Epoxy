/*************************\
          Imports
\*************************/
 
import {Chunks as ASTChunks,Expressions as ASTExpressions,ComplexExpressions as ASTComplexExpressions} from "https://fireyauto.github.io/Epoxy/src/asttypes.js";
import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {Tokens as _Tokens} from "https://fireyauto.github.io/Epoxy/src/tokens.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

class ASTExpression {
	constructor(Value,Priority=-1){
			this.Value=Value,this.Priority=Priority;
	}
}

//

const ALLOWED_CHUNK_COMPLEX_EXPRESSIONS = [
	["COLON","Operator"],
	["DOT","Operator"],
	["SELFCALL","Operator"],
	["POPEN","Bracket"],
	["ADD","Operator"],
	["SUB","Operator"],
	["MUL","Operator"],
	["DIV","Operator"],
	["MOD","Operator"],
	["POW","Operator"],
	["IOPEN","Bracket"],
	["ASSIGNMENT","Operator"],
	["MCALL","Operator"],
];

const ALLOWED_CHUNK_EXPRESSIONS = [
	["Identifier"],
	["POPEN","Bracket"],
	["DO","Keyword"],
];

const ALLOWED_CHUNK_AST_TYPES = [
	"Assignment",
	"Call",
	"SelfCall",
	"DestructuringAssignment",
	"ComplexAssignment",
	"MCall",
	"Do",
]

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
		if(this.Token)this.Line=this.Token.Line,this.Index=this.Token.Index;	
		return this.Token;
	}
	To(Position){
		this.Position=Position;
		this.Token=this.Tokens[this.Position];
		if(this.Token)this.Line=this.Token.Line,this.Index=this.Token.Index;	
		return this.Token;
	}
	IsEnd(){
		return this.Position>=this.Tokens.length;
	}
	//{{ Token Naming Methods }}\\
	GetFT(Options={}){
		if(this.IsEnd()&&(!Options.Tokens&&!Options.Type))return "end of script";
		let Type = Options.Token?Options.Token.Type:Options.Type,
			Literal = Options.Token?Options.Token.Literal:Options.Literal,
			Name = Options.Token?Options.Token.Name:Options.Name;
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
		if(!Next)return Expression.Value;
		if(Next.is("LINEEND","Operator"))return Expression.Value;
		//if(Next.isType("Identifier")&&Current.isType("Identifier"))ErrorHandler.ASTError(this,"Unexpected",[`identifier while parsing ${Type}`]);
		let Allowed=AllowList.length>0,
			Passed=false;
		if(Allowed){
			for(let Allow of AllowList){
				if(Next.is(...Allow)){
					Passed=true;
					break;
				}
			}
			if(!Passed){
				let Valid=false;
				for(let CE of ASTComplexExpressions)
					if(Next.is(CE.Name,CE.Type)){
						Valid=true;
						break
					}
				Passed=!Valid;
			}
			if(!Passed)return ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:Next})} while parsing ${Type}`]);
		}
		for(let ComplexExpression of ASTComplexExpressions){
			if(!Next.is(ComplexExpression.Name,ComplexExpression.Type))continue;
			if(Expression.Priority<=ComplexExpression.Priority){
				Expression = ComplexExpression.Call.bind(this)(Expression.Value,ComplexExpression.Priority,AllowList,Type);
				Expression.Priority = Priority;
				if(ComplexExpression.Stop===true)break;
				if(Expression.Value instanceof ASTBase&&Expression.Value.Type==="Assignment")return Expression.Value;
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
					if(!Passed)return ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:Token})} while parsing ${EType}`]);
				}
				let Exp = Expression.Call.bind(this)(Priority,AllowList,Type);
				Result = Exp.Value;
				Priority = Exp.Priority;
				if(Expression.Stop===true)return Result;
				break;
			}
		}
		if(Result===undefined)ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:Token})} while parsing ${EType}`]);
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
		this.ErrorIfEOS(" while parsing expression list");
		if(this.Token.is(Start.Name,Start.Type)){
			this.Next();
			this.ErrorIfEOS(" while parsing expression list");
			if(this.Token.is(End.Name,End.Type))return[];
			let List = this.ExpressionList(Priority,AllowList,Type,End,EAllowList,EType);
			if(!End.Stopped)this.TestNext(End.Name,End.Type),this.Next();
			return List;
		}else{
			let T = _Tokens.GetFromName(Start.Name,Start.Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:T.Type,Name:T.Name,Literal:T?T.Literal:T.Literal}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	ExpressionInside(Start,End,Priority,AllowList,Type,EAllowList,EType){
		if(this.Token.is(Start.Name,Start.Type)){
			this.Next();
			this.ErrorIfEOS(" while parsing expression");
			if(this.Token.is(End.Name,End.Type))return;
			let Result = this.ParseExpression(Priority,AllowList,Type,End,EAllowList,EType);
			this.TestNext(End.Name,End.Type);
			this.Next();
			return Result;
		}else{
			let T = _Tokens.GetFromName(Start.Name,Start.Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:T.Type,Name:T.Name,Literal:T?T.Literal:T.Literal}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	//{{ Identifier Parsing Methods }}\\
	IdentifierList(Options,End){
		let List = [];
		this.ErrorIfEOS(" while parsing identifier list");
		this.Chunk.IdentifierList = true;
		do{
			let Identifier = {
				Name:undefined,
				Value:undefined,
				Line:this.Token.Line,
				Index:this.Token.Index,
				Pointer:undefined,
				Vararg:false,
			}
			let Run = true;
			if(Options.Modifiers&&Options.Modifiers.length>0){
				for(let Modifier of Options.Modifiers){
					if(Modifier.Check(this,Options,Identifier)){
						Modifier.Call(this,Options,Identifier);
						Run=false;
						break;
					}
				}
			}
			if(Run){
				if(Options.AllowPointer){
					this.Test(this.Token,"POPEN","Bracket");
					this.Next();
					this.TypeTest(this.Token,"Identifier");
					Identifier.Pointer = this.Token.Name;
					this.TestNext("PCLOSE","Bracket");
					this.Next(2);
				}
				if(Options.AllowVararg){
					if(this.Check(this.Token,"VARARG","Operator")){
						this.Next();
						Identifier.Vararg=true;
					}
				}
				if(Options.AllowExpression&&this.Check(this.Token,"IOPEN","Bracket")){
					this.Next();
					Identifier.Name = this.ParseExpression();
					this.TestNext("ICLOSE","Bracket");
					this.Next();
				}else{
					let WasKeyword=false;
					if(Options.AllowKeywords){
						if(this.Token.Type==="Keyword"){
							Identifier.Name = this.Token.Literal;
							WasKeyword=true;
						}
					}
					if(!WasKeyword){
						this.TypeTest(this.Token,"Identifier");
						Identifier.Name = this.Token.Name;
					}
				}
				if(Options.AllowDefault){
					if(this.CheckNext("COLON","Operator")){
						this.Next(2);
						Identifier.Value = this.ParseExpression(Options.Priority,Options.AllowList,Options.Type,Options.EAllowList,Options.EType);
					}
				}
			}
			List.push(Identifier);
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
		delete this.Chunk.IdentifierList;
		return List;
	}
	IdentifierListInside(Start,End,Options){
		this.ErrorIfEOS(" while parsing identifier list");
		if(this.Token.is(Start.Name,Start.Type)){
			this.Next();
			this.ErrorIfEOS(" while parsing identifier list");
			if(this.Token.is(End.Name,End.Type))return[];
			let List = this.IdentifierList(Options,End);
			if(!End.Stopped)this.TestNext(End.Name,End.Type),this.Next();
			return List;
		}else{
			let T = _Tokens.GetFromName(Start.Name,Start.Type);
			ErrorHandler.ASTError(this,"ExpectedGot",[this.GetFT({UseType:true,UseLiteral:true,Type:T.Type,Name:T.Name,Literal:T?T.Literal:T.Literal}),this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})]);
		}
	}
	//{{ Chunk Parsing Methods }}\\
	ParseBlock(Type=" while parsing chunk",StartToken){
		let Block=this.OpenChunk();
		if(StartToken){
			let Token=this.Token;
			this.Test(Token,StartToken.Name,StartToken.Type);
			this.Next();
		}
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
	ParseRChunk(){
		let Token=this.Token;
		for(let Chunk of ASTChunks){
			if(Token.is(Chunk.Name,Chunk.Type)){
				let Result = Chunk.Call.bind(this)();
				return Result;
			}
		}	
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
		let Result = this.ParseExpression(-1,ALLOWED_CHUNK_COMPLEX_EXPRESSIONS,undefined,ALLOWED_CHUNK_EXPRESSIONS);
		if(Result===undefined)ErrorHandler.ASTError(this,"Unexpected",[this.GetFT({UseType:true,UseLiteral:true,Token:Token})]);
		if(!(Result instanceof ASTBase)||!ALLOWED_CHUNK_AST_TYPES.includes(Result.Type))ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:Token})}`]);
		this.SkipLineEnd();
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
