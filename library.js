/*************************\
          Imports
\*************************/

/*************************\
      Internal Classes
\*************************/

class Thread {
	constructor(Stack,State){
		let Hidden = {
			State:State,
			Resolve:undefined,
			Yield:false,
		};
		this.GetState = function(Stk,St){
			if(Stk instanceof Stack.constructor&&St instanceof State.constructor)return null;
			return Hidden.State;
		}
		this.GetResolve = function(Stk,St){
			if(Stk instanceof Stack.constructor&&St instanceof State.constructor)return null;
			return Hidden.Resolve;
		}
		this.WriteResolve = function(Stk,St){
			if(Hidden.Yield===true)return null;
			if(Stk instanceof Stack.constructor&&St instanceof State.constructor)return null;
			Hidden.Resolve=Stk;
		}
		this.Yield = function(Stk,St){
			if(Hidden.Yield===true)return null;
			if(Stk instanceof Stack.constructor&&St instanceof State.constructor)return null;
			Hidden.Yield=true;
			return true;
		}
		this.Resume = function(Stk,St,...Arguments){
			if(!Hidden.Yield)return null;
			if(Stk instanceof Stack.constructor&&St instanceof State.constructor)return null;
			Hidden.Yield=false;
			Hidden.Resolve(...[Stk,St,...Arguments]);
		}
		this.running = function(Stk,St){
			return !Hidden.Yield;
		}
	}
	toString(){
		return "[Epoxy Thread]";	
	}
}

/*************************\
          Library
\*************************/

const Library = {
	//{{ Functions }}\\
	log:function(Stack,State,...a){
		console.log(...a);
	},
	warn:function(Stack,State,...a){
		console.warn(...a);
	},
	error:function(Stack,State,...a){
		throw Error(...a);
	},
	wait:async function(Stack,State,Time=1){
		return await new Promise(r=>setTimeout(r,Time*1000))
	},
	type:function(Stack,State,x){
		let t=typeof x;
		if(t==="object"&&x instanceof Array)return"array";
		if(x===null||x===undefined)return"null";
		return t;
	},
	time:(Stack,State)=>Date.now()/1000,
	getenv:function(Stack,State,Up=0){
		let SearchState = State,AccessPoint = "__CACHED_ENV";
		while(Up>0){
			let Upper = SearchState.Parent;
			if(!Upper)break;
			SearchState = Upper;
			Up--;
		}
		if(!SearchState)return {};
		if(SearchState[AccessPoint])return SearchState[AccessPoint];
		let Access = new Proxy({},{
			get:function(self,Name){
				return SearchState.GetVariable(Name);
			},
			set:function(self,Name,Value){
				SearchState.SetVariable(Name,Value);
				return Value;
			}
		});
		SearchState[AccessPoint]=Access;
		return Access;
	},
	async:(Stack,State,c,...a)=>{
		setTimeout(()=>c(Stack,State,...a),0);
	},
	tostring:(Stack,State,a)=>String(a),
	tofloat:(Stack,State,a)=>parseFloat(a),
	toint:(Stack,State,a)=>parseInt(a),
	assert:(Stack,State,c,m)=>{
		if(!c)Library.error(Stack,State,m);	
	},
	//{{ Libraries }}\\
	string:{
		split:function(Stack,State,a,b){
			return a.split(b||"");
		},
		repeat:function(Stack,State,a,b){
			return a.repeat(b);
		},
		starts:function(Stack,State,a,b){
			return a.startsWith(b);
		},
		ends:function(Stack,State,a,b){
			return a.endsWith(b);
		},
		sub:function(Stack,State,a,b,c){
			return a.substring(b,c);
		},
		subs:function(Stack,State,a,b,c){
			return a.substr(b,c);
		},
		match:function(Stack,State,a,b){
			return a.match(b);
		},
		reverse:function(Stack,State,a,b){
			return a.split("").reverse().join("");
		},
		lower:function(Stack,State,a){
			return a.toLowerCase();
		},
		upper:function(Stack,State,a){
			return a.toUpperCase();
		},
		char:function(Stack,State,a){
			return String.fromCharCode(a);
		},
		byte:function(Stack,State,a){
			return a.charCodeAt(0);
		},
	},
	array:{
		has:function(Stack,State,a,b){
			return a.includes(b);
		},
		find:function(Stack,State,a,b){
			return a.indexOf(b);
		},
		reverse:function(Stack,State,a){
			return a.reverse();
		},
		join:function(Stack,State,a,b){
			return a.join(b||"");
		},
		append:function(Stack,State,a,b){
			return a.push(b);
		},
		prepend:function(Stack,State,a,b){
			return a.unshift(b);
		},
		remove:function(Stack,State,a,b){
			return a.splice(b,1);
		},
		pop:function(Stack,State,a){
			return a.pop();
		},
		prepop:function(Stack,State,a){
			return a.shift();
		},
		each:function(Stack,State,a,c){
			for(let k in a)c(Stack,State,a[k],k,a);
		},
	},
	bit:{
		and:(sk,st,a,b)=>a&b,
		or:(sk,st,a,b)=>a|b,
		xor:(sk,st,a,b)=>a^b,
		not:(sk,st,a)=>~a,
		rshift:(sk,st,a,b)=>a>>b,
		lshift:(sk,st,a,b)=>a<<b,
	},
	thread:{
		get:async function(Stack,State){
			let T = State.GlobalRead("Thread");
			if(!T){
				T = new Thread(Stack,State);
				State.Write("Thread",T);
			}
			return T;
		},
		yield:async function(Stack,State,T){
			if(!(T instanceof Thread))return null;
			return await new Promise(r=>{
				T.WriteResolve(r);
				let R=T.Yield();
				if(R===null)return r();
			}).then(x=>x);
		},
		resume:async function(Stack,State,T,...Arguments){
			if(!(T instanceof Thread))return null;
			await T.Resume(...Arguments);
		},
		async:async function(Stack,State,Call,...AR){
			(async(...A)=>Call(Stack,State,...A))(...AR);
		},
		suspend:async function(Stack,State,T,Time){
			if(!(T instanceof Thread))return null;
			setTimeout(()=>Library.thread.resume(Stack,State,T),Time*1000);
			await Library.thread.yield(Stack,State,T);
		},
		genasync:async function(Stack,State,Call){
			let Proxy = async(...A)=>Call(...A);
			return function(...A){
				Proxy(...A);	
			}
		},
	},
	math:{
		sin:(stk,s,x)=>Math.sin(x),
		cos:(stk,s,x)=>Math.cos(x),
		tan:(stk,s,x)=>Math.tan(x),
		asin:(stk,s,x)=>Math.asin(x),
		acos:(stk,s,x)=>Math.acos(x),
		atan:(stk,s,x)=>Math.atan(x),
		atan2:(stk,s,y,x)=>Math.atan2(y,x),
		floor:(stk,s,x)=>Math.floor(x),
		ceil:(stk,s,x)=>Math.ceil(x),
		round:(stk,s,x)=>Math.round(x),
		sqrt:(stk,s,x)=>Math.sqrt(x),
		pow:(stk,s,x)=>Math.pow(x),
		log:(stk,s,x)=>Math.log(x),
		abs:(stk,s,x)=>Math.abs(x),
		log10:(stk,s,x)=>Math.log10(x),
		logb:(stk,s,x,b=10)=>Math.log10(x)/Math.log10(b),
		nround:(stk,s,x,b=0)=>{let m=10**b;return Math.floor(x*m+0.5)/m},
		rad:(stk,s,x)=>x*(Math.PI/180),
		deg:(stk,s,x)=>x*(180/Math.PI),
		random:(stk,s,mi,ma)=>Math.floor(Math.random()*(ma-mi+1)+mi),
		nroot:(stk,s,x,b=2)=>x**(1/b),
		max:(stk,s,...a)=>Math.max(...a),
		min:(stk,s,...a)=>Math.min(...a),
		clamp:(stk,s,x,a,b)=>Math.max(a,Math.min(x,b)),
		pi:Math.PI,
		e:Math.E,
	},
	json:{
		encode:(stk,s,x)=>JSON.stringify(x),
		decode:(stk,s,x)=>JSON.parse(x),
	},
	regex:{
		new:(stk,s,x,i)=>new RegExp(x,i)	
	},
	debug:{
		varlen:(stk,s)=>s.Variables.length,
		gvarlen:(stk,s)=>s.GetGlobalVariables().length,
		newvar:(stk,s,n,v,c=false)=>{
			if(typeof n!="string")return;
			s.NewVariable(n,v,{
				Constant:c,	
			});
			return v;
		},
		delvar:(stk,s,n,l=false)=>{
			if(typeof n!="string")return;
			s.DeleteVariable(n,l);
		},
		getvar:(stk,s,n)=>{
			return s.GetVariable(n);
		},
		read:(stk,s,n)=>{
			let r=s.Read(n);
			if(r===undefined)r=null;
			return r;
		},
	},
	io:{
		prompt:(stk,s,q)=>window.prompt(q),
		alert:(stk,s,t)=>window.alert(t),
		confirm:(stk,s,t)=>window.confirm(t),
		log:(stk,s,...a)=>console.log(...a),
	},
};

Library.env = Library;

/*************************\
          Exports
\*************************/

export {Library};
