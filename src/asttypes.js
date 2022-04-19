/*************************\
          Imports
\*************************/
 
import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {Tokens as _Tokens} from "https://fireyauto.github.io/Epoxy/src/tokens.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
    Internal Functions
\*************************/

function ProxyToken(Name,Type){
	return {Name:Name,Type:Type};	
}

/*************************\
          Chunks
\*************************/

const Chunks = [
	{
		Name:"VAR",
		Type:"Keyword",
		Call:function(){
			this.Next();
			let Node = this.NewNode("NewVariable");
			Node.Write("Variables",this.IdentifierList({
				AllowDefault:true,
				Priority:-1,
				EType:"variable expression",
			}));
			return Node;
		},
	},
	{
		Name:"DVAR",
		Type:"Keyword",
		Call:function(){
			this.Next();
			let Node = this.NewNode("NewDestructuringVariable");
			let Variables = this.IdentifierList({Priority:-1,EType:"destructuring variable expression"});
			Node.Write("Variables",Variables);
			if(this.CheckNext("COLON","Operator")){
				this.Next(2);
				Node.Write("Value",this.ParseExpression());
			}
			return Node;
		},
	},
	{
		Name:"ITERATE",
		Type:"Keyword",
		Call:function(){
			this.Next();
			let Node = this.NewNode("IterationLoop");
			Node.Write("Variables",this.IdentifierList({AllowDefault:false,AllowPointers:false}));
			this.Next();
			this.ErrorIfEOS(" while parsing iteration loop");
			if(this.Check(this.Token,"IN","Keyword"))Node.Write("Getters",[0]);
			else if(this.Check(this.Token,"OF","Keyword"))Node.Write("Getters",[1]);
			else if(this.Check(this.Token,"AS","Keyword"))Node.Write("Getters",[0,1]);
			else ErrorHandler.ASTError(this,"Unexpected",[`${this.GetFT({UseType:true,UseLiteral:true,Token:this.Token})} while parsing iteration loop`]);
			this.Next();
			Node.Write("Object",this.ParseExpression());
			this.Next();
			Node.Write("Body",this.ParseBlock(" while parsing iteration loop body",ProxyToken("DO","Keyword")));
			return Node;
		},
	},
	{
		Name:"IF",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("If");
			this.Next();
			Node.Write("Expression",this.ParseExpression());
			this.Next();
			this.Test(this.Token,"THEN","Keyword");
			this.Next();
			this.ErrorIfEOS(" while parsing if statement");
			let Conditions = [];
			let Block = undefined,
			    self = this;
			function OpenBlock(){
				let NB = self.OpenChunk();
				if(Block){
					self.OpenChunks.pop();
				}
				Block=NB;
				return NB;
			}
			OpenBlock();
			Block.Type="IfBlock";
			Node.Write("Body",Block);
			while(!this.Token.is("CLOSE","Keyword")){
				let Token = this.Token;
				if(Token.is("ELSEIF","Keyword")){
					OpenBlock();
					Block.Type="IfBlock";
					this.Next();
					let Condition = this.NewNode("ElseIf");
					Condition.Write("Expression",this.ParseExpression());
					this.TestNext("THEN","Keyword");
					this.Next(2);
					Condition.Write("Body",Block);
					Conditions.push(Condition);
				}else if(Token.is("ELSE","Keyword")){
					OpenBlock();
					Block.Type="IfBlock";
					this.Next();
					let Condition = this.NewNode("Else");
					Condition.Write("Body",Block);
					Conditions.push(Condition);
				}else{
					this.ParseChunk();
					this.Next();
				}
				this.ErrorIfEOS(" while parsing if statement");
			}
			Node.Write("Conditions",Conditions);
			this.Chunk=this.OpenChunks.pop();
			/*
			Node.Write("Body",this.ParseBlock(" while parsing if statement",ProxyToken("THEN","Keyword")));
			let Conditions = [];
			while(this.CheckNext("ELSEIF","Keyword")||this.CheckNext("ELSE","Keyword")){
				if(this.CheckNext("ELSEIF","Keyword")){
					this.Next(2);
					let Condition = this.NewNode("ElseIf");
					
					Condition.Write("Body",this.ParseBlock(" while parsing elseif statement",ProxyToken("THEN","Keyword")));
					Conditions.push(Condition);
				}else if(this.CheckNext("ELSE","Keyword")){
					this.Next(2);
					let Condition = this.NewNode("Else");
					Condition.Write("Body",this.ParseBlock(" while parsing else statement"));
					Conditions.push(Condition);
					break;
				}
			}
			Node.Write("Conditions",Conditions);
			*/
			return Node;
		},
	},
	{
		Name:"LOOP",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("For");
			this.Next();
			Node.Write("Variables",this.IdentifierList({AllowDefault:true}));
			this.TestNext("LINEEND","Operator"),this.Next(2);
			Node.Write("Condition",this.ParseExpression());
			this.TestNext("LINEEND","Operator"),this.Next(2);
			Node.Write("Increment",this.ParseExpression());
			this.Next();
			Node.Write("Body",this.ParseBlock(" while parsing loop body",ProxyToken("DO","Keyword")));
			return Node;
		},
	},
	{
		Name:"WHILE",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("While");
			this.Next();
			Node.Write("Condition",this.ParseExpression());
			this.Next();
			Node.Write("Body",this.ParseBlock(" while parsing while loop body",ProxyToken("DO","Keyword")));
			return Node;
		},
	},
	{
		Name:"FUNCTION",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("NewFunction");
			this.Next();
			this.TypeTest(this.Token,"Identifier");
			Node.Write("Name",this.Token.Literal);
			this.Next();
			Node.Write("Parameters",this.IdentifierListInside(ProxyToken("POPEN","Bracket"),ProxyToken("PCLOSE","Bracket"),{AllowDefault:true,AllowVararg:true}));
			this.Next();
			Node.Write("Body",this.ParseBlock(" while parsing function body"));
			return Node;
		},
	},
	{
		Name:"RETURN",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("Return");
			if(this.Chunk&&this.Chunk.Type==="IfBlock"){
				if(this.CheckNext("ELSEIF","Keyword")||this.CheckNext("ELSE","Keyword")){
					Node.Write("Expression",null);
					return Node;
				}
			}
			if(this.CheckNext("CLOSE","Keyword")){
				Node.Write("Expression",null);
				return Node;
			}
			this.Next();
			Node.Write("Expression",this.ExpressionList());
			return Node;
		},
	},
	{
		Name:"BREAK",
		Type:"Keyword",
		Call:function(){
			return this.NewNode("Break");
		},
	},
	{
		Name:"CONTINUE",
		Type:"Keyword",
		Call:function(){
			return this.NewNode("Continue");
		},
	},
	/*
	{
		Name:"Name",
		Type:"Type",
		Call:function(){
			let Node = this.NewNode("Type");
			
			return Node;
		},
	},
	*/
];

/*************************\
        Expressions
\*************************/

const Expressions = [
	{
		Type:"Constant",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			return this.ASTExpression(this.Token.Literal,Priority);
		},
	},
	{
		Type:"Identifier",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("GetVariable");
			let List = [this.Token.Literal],Index = this.Position,Checkable = false;
			while(this.CheckNext("COMMA","Operator")){
				this.Next(2);
				let Token = this.Token;
				if(Token&&Token.Type==="Identifier"){
					List.push(Token.Literal);
				}else{
					this.To(Index);
					break;	
				}
				if(!this.CheckNext("COMMA","Operator")){
					Checkable = true;	
				}
			}
			if(Checkable){
				if(this.CheckNext("COLON","Operator")){
					this.Next(2);
					Node.Write("Names",List);
					Node.Write("Values",this.ExpressionList());
					Node.Type = "DestructuringAssignment";
					return this.ASTExpression(Node,Priority);
				}else{
					this.To(Index);	
				}
			}
			Node.Write("Name",this.Token.Literal);
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"POPEN",
		Type:"Bracket",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			this.Next();
			let Node = this.ParseExpression(-1);
			this.TestNext("PCLOSE","Bracket");
			this.Next();
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"LINEEND",
		Type:"Operator",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			return this.ASTExpression(null,Priority);
		},
	},
	{
		Name:"NOT",
		Type:"Operator",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			this.Next();
			let Node = this.NewNode("Not");
			Node.Write("V1",this.ParseExpression(400));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"SUB",
		Type:"Operator",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			this.Next();
			let Node = this.NewNode("Negative");
			Node.Write("V1",this.ParseExpression(400));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"LENGTH",
		Type:"Operator",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			this.Next();
			let Node = this.NewNode("Length");
			Node.Write("V1",this.ParseExpression(400));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"IOPEN",
		Type:"Bracket",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("Array");
			Node.Write("List",this.ExpressionListInside({Name:"IOPEN",Type:"Bracket"},{Name:"ICLOSE",Type:"Bracket"}));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"BOPEN",
		Type:"Bracket",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("Object");
			Node.Write("Object",this.IdentifierListInside(ProxyToken("BOPEN","Bracket"),ProxyToken("BCLOSE","Bracket"),{AllowDefault:true,AllowExpression:true}));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"VARARG",
		Type:"Operator",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("Unpack");
			this.Next();
			Node.Write("List",this.ParseExpression());
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"FUNCTION",
		Type:"Keyword",
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("NewFastFunction");
			this.Next();
			Node.Write("Parameters",this.IdentifierListInside(ProxyToken("POPEN","Bracket"),ProxyToken("PCLOSE","Bracket"),{AllowDefault:true,AllowVararg:true}));
			this.Next();
			Node.Write("Body",this.ParseBlock(" while parsing function body"));
			return this.ASTExpression(Node,Priority);;
		},
	},
	/*
	
	*/
	/*
	{
		Name:"Name",
		Type:"Type",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("Type");
			
			return this.ASTExpression(Node,Priority);
		},
	},
	*/
];

/*************************\
    Complex Expressions
\*************************/

const ComplexExpressions = [
	{
		Name:"SUB",
		Type:"Operator",
		Stop:false,
		Priority:300,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Sub");
			Node.Write("V1",Value);
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",2);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"ADD",
		Type:"Operator",
		Stop:false,
		Priority:320,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Add");
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",1);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"MUL",
		Type:"Operator",
		Stop:false,
		Priority:360,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Mul");
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",3);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"DIV",
		Type:"Operator",
		Stop:false,
		Priority:340,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Div");
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",4);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"MOD",
		Type:"Operator",
		Stop:false,
		Priority:340,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Mod");
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",5);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"POW",
		Type:"Operator",
		Stop:false,
		Priority:380,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Pow");
			if(this.Check(this.Token,"COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",6);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"IOPEN",
		Type:"Bracket",
		Stop:false,
		Priority:700,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("GetIndex");
			Node.Write("Object",Value);
			Node.Write("Index",this.ParseExpression(-1));
			this.TestNext("ICLOSE","Bracket");
			this.Next();
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"DOT",
		Type:"Operator",
		Stop:false,
		Priority:700,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("GetIndex");
			Node.Write("Object",Value);
			let Token = this.Token;
			if(!Token.isType("Identifier")&&!Token.isType("Keyword"))ErrorHandler.ASTError(this,"ExpectedGot",["identifier for index name",this.GetFT({UseType:true,UseLiteral:true,Token:Token})]);
			Node.Write("Index",Token.Literal);
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"COLON",
		Type:"Operator",
		Stop:true,
		Priority:50,
		Call:function(Value,Priority,AllowList,Type){
			if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected",["identifier or index for assignment"]);
			this.Next(2);
			let Node = this.NewNode("Assignment");
			Node.Write("Type",0);
			Node.Write("Name",Value);
			Node.Write("Value",this.ParseExpression());
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"POPEN",
		Type:"Bracket",
		Stop:false,
		Priority:1000,
		Call:function(Value,Priority,AllowList,Type){
			this.Next();
			let Node = this.NewNode("Call");
			Node.Write("Call",Value);
			Node.Write("Arguments",this.ExpressionListInside({Name:"POPEN",Type:"Bracket"},{Name:"PCLOSE",Type:"Bracket"}));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"SELFCALL",
		Type:"Operator",
		Stop:false,
		Priority:900,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("SelfCall");
			Node.Write("Object",Value);
			this.ErrorIfEOS();
			let Token = this.Token;
			if(!Token.isType("Identifier")&&!Token.isType("Keyword"))ErrorHandler.ASTError(this,"ExpectedGot",["identifier for index name",this.GetFT({UseType:true,UseLiteral:true,Token:Token})]);
			Node.Write("Index",Token.Literal);
			this.TestNext("POPEN","Bracket");
			this.Next();
			Node.Write("Arguments",this.ExpressionListInside({Name:"POPEN",Type:"Bracket"},{Name:"PCLOSE",Type:"Bracket"}));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"EQ",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Eq");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"LT",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Lt");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"LEQ",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Leq");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"GT",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Gt");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"GEQ",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Geq");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"NEQ",
		Type:"Operator",
		Stop:false,
		Priority:200,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Neq");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"AND",
		Type:"Operator",
		Stop:false,
		Priority:150,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("And");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"OR",
		Type:"Operator",
		Stop:false,
		Priority:151,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Or");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	/*
	
	*/
	/*
	{
		Name:"Name",
		Type:"Type",
		Stop:false,
		Priority:0,
		Call:function(Value,Priority,AllowList,Type){
			let Node = this.NewNode("Type");
			
			return this.ASTExpression(Node,Priority);
		},
	},
	*/
];

/*************************\
          Exports
\*************************/

export {Chunks,Expressions,ComplexExpressions};
