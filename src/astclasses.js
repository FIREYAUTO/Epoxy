/*************************\
         AST Base
\*************************/

class ASTBase {
	constructor(Stack,Type){
		this.Stack=Stack,
			this.Type=Type,
			this.Line=Stack.Line,
			this.Index=Stack.Index,
			this.EndLine=Stack.Line,
			this.EndIndex=Stack.Index;
	}
	Close(){
		this.EndLine=this.Stack.Line,
			this.EndIndex=this.Stack.Index;
	}
}

/*************************\
         AST Node
\*************************/

class ASTNode extends ASTBase {
	constructor(...Arguments){
		super(...Arguments);
		this.Data = {};
	}
	Write(Name,Value){
		this.Data[Name]=Value;
		if(Value instanceof ASTBase)Value.Close();
	}
	Read(Name){
		return this.Data[Name];	
	}
	toString(){
		let Text = [];
		for(let k in this.Data){
			let v = this.Data[k];
			Text.push(`<span style="color:#127fdf">${String(k)}</span>:${String(v)}`);
		}
		return `<b>ASTNode</b>.<span style="color:#ff1a43"><b>${this.Type}</b></span>{${Text.join(", ")}}`;
	}
}

/*************************\
         AST Block
\*************************/

class ASTBlock extends ASTBase {
	constructor(...Arguments){
		super(...Arguments);
		this.Data = [];
	}
	get length(){
		return this.Data.length;	
	}
	Write(Value){
		this.Data.push(Value);
		if(Value instanceof ASTBase)Value.Close();
	}
	Read(Name){
		return this.Data[Name];	
	}
	toString(){
		let Data = [];
		for(let v of this.Data)Data.push(String(v));
		return `<b>ASTBlock</b>.<span style="color:#ff1a43"><b>${this.Type}</b></span>[${Data.join(", ")}]`;
	}
}

/*************************\
          Exports
\*************************/

export {ASTBase,ASTNode,ASTBlock};
