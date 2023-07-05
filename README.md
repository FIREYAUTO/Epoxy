# Epoxy
The Epoxy Programming Language
***
# What is Epoxy?
Epoxy is a interpreted, high-level, structured, dynamically typed programming language written in JavaScript which has a similar syntax design to lua; it has very simplistic syntax, and was designed to take a step away from c-style & js-style languages.

Epoxy is the first language created by FIREYAUTO to have a fully sandboxed environment from its parent language due to the nature of how the closures in the language work. This means that only functions specifically designed for the language will work, and there is a barrier from parent operations to the language operations to follow its own set of rules for logical operations and more.

Epoxy is considerably slow in the grand scheme of a programming language, but this is mainly due to the abstraction to make Epoxy easier to develop and maintain. In the future there may be tests to design compilers which could enhance the performance of Epoxy.

# Reserved Keywords
The tokens listed below are reserved keywords which cannot be used as variable names. Although, all of these can be used in object indexes though.

```
var, fn, while, do, cls, loop, iter, of, as, in, true, false, null, return, dvar, if, elseif, else, break, continue, then, switch, case, default
```
***
# Syntax Overview

## Prerequisites
* You are expected to already know at least one programming language with a similar style to lua or javascript, otherwise the overview below will probably not make much sense.
* Definition Keys:
> `<Expression>`: An expression is anything ranging from identifiers to constants to anonymous functions to basic datatypes<br>
> `<Variable Name>`: An identifier which is not from the reserved keywords list listed above<br>
> `,...`: The previous definition can be repeated using a comma<br>
> `<Code>`: Any chunk of code<br>
> `<Variable Declaration>`: Variable declarations without using the `var` or `dvar` keywords<br>
> `<Condition>`: A determining expression which allows for loops or other things to run<br>
> `<Parameter>`: An identifier for function parameters<br>
> `<Variable>`: A conglomerate of variables or indexes<br>
> `<Text>`: A string of characters<br>
> `<Function Declaration>`: A basic function declaration<br>
> `<Complex Expression>`: A complex expression<br>

***
## If Statements

```
if <Condition> then
	<Code>
elseif <Condition> then
	<Code>
else
	<Code>
cls
```

## Switch Statements
This statement behaves as you'd expect it to. Doesn't require `break` statements in between cases.
```
switch <Expression> do
	case <Expression> do
		<Code>
	case <Expression> do
		<Code>
	default
		<Code>
cls
```
***
## Loops

### Loop

```
loop <Variable Declaration>;<Condition>;<Variable Increment> do
	<Code>
cls
```

### Iterate

```
iter <Variable Name>,... <as|in|of|> <Expression> do
	<Code>
cls
```

### While

```
while <Condition> do
	<Code>
cls
```
***
## Variables

```
--Declaring Basic Variables
var <Variable Name>: <Expression>,
	...
--Declaring Destructuring Variables
dvar <Variable Name>,...: <Expression>,...

--Updating Basic Variables

<Variable Name>: <Expression>

--Updating Multiple Variables

<Variable Name>,...: <Expression>,...
```

## Functions

```
fn <Variable Name>(<Parameter>: <Expression>,...)
	<Code>
cls
```
***
## Stack Controlling

### Return

```
return <Expression>,...
```

### Break & Continue

```
break

continue
```

### Try & Catch

```
try
	<Code>
catch <Variable Name> do
	<Code>
cls
```

***
## Operators

### Math Operators

```
<Expression> + <Expression> --Add
<Expression> - <Expression> --Subtract
<Expression> * <Expression> --Multiply
<Expression> / <Expression> --Divide
<Expression> % <Expression> --Modulus
<Expression> ^ <Expression> --Exponent
- <Expression> --Negative
```

### Logical Operators

```
<Expression> && <Expression> --And
<Expression> || <Expression> --Or
! <Expression> --Not
```

### Comparison Operators

```
<Expression> == <Expression> --Equals
<Expression> > <Expression> --Greater Than
<Expression> >= <Expression> --Greater Than or Equal to
<Expression> < <Expression> --Less Than
<Expression> <= <Expression> --Less Than or Equal to
<Expression> != <Expression> --Not Equal to
```

### Assignment Operators

```
<Variable> : <Expression>
<Variable> +: <Expression>
<Variable> -: <Expression>
<Variable> *: <Expression>
<Variable> /: <Expression>
<Variable> %: <Expression>
<Variable> ^: <Expression>
```

### Other Operators

```
# <Expression> --Length Operator
<Expression> .. <Expression> --Range operator (Creates a list from a to b)
```

### Indexing Operators

```
<Expression>.<Identifier>: <Expression>
<Expression>[<Expression>]: <Expression>
```
***
## Data Types

### Strings

```
"<Text>"
'<Text>'
```

### Booleans

```
true, false, null
```

### Numbers

```
1, 1.2, 1.2e3, 1e3, 1.2e-3, 1e-2
```

### Arrays

```
[<Expression>,...]
```

### Objects

```
{ <Identifier>: <Expression> }
{ [<Expression>]: <Expression> }
{ <Variable Name> }
{ <Function Declaration> }
```
***
## Calling

### Basic Calling

```
<Expression>(<Expression>,...)
```

### Self Calling

```
<Expression> >> <Identifier>(<Expression>,...)
```

### Multi Calling (MCall)

```
<Expression> | (<Expression>,...) ... |
```
Example:
```
log|("hi")("there")("from")("Epoxy!")|
```
Something to note is that the mcall expression will return an unpack object, meaning this is how you'd be able to use it:
```
fn Add(a,b)
	return a+b
cls

dvar a,b,c: Add|(1,2)(10,20)(100,200)| --This is where it can be used

log(a,b,c) --3 30 300
```

***
## Comments

```
-- Text

--[[
Text
--]]
```

## Expressional If Operator
The expressional `if` operator is used to allow for a form of ternary expression like in JavaScript.
```
if <Condition> then <Expression> elseif <Condition> then <Expression> else <Expression>
```
Example:
```
var Test: if true then "Hello, world!" else "No"
log(Test)
```
## Complex Assignment Operator
The complex assignment operator `=` allows for a easier way to set variables/indexes in objects. This operator will set the current variable/index in an object to itself parsed with the complex expression.
```
<Expression> = <Complex Expression>
```
Example:
```
var test: fn(a,b)
	return a+b
cls

test=(1,2)

log(test) -- 3
```
## Do Expression
The `do` expression is a complicated expression to wrap your head around. It may not have many practical uses, but it exists in the language for the people who need it.
```
do(<Expression>,...) <Complex Expression>
```
Example:
```
log(do(1,2,3)+1) --Output should be "2,3,4"
```
***
# Standard Library Overview

## Functions

### log
`log(...Arguments)` This function will log the given arguments to the console
### warn
`warn(...Arguments)` This function will log the given arguments to the console using a warning color
### error
`error(...Arguments)` This function will error with the provided arguments, halting the completion of the current thread
### type
`type(Argument)` This function will return the type of the given argument
### wait
`wait(Time)` This function will wait the given time in seconds
### time
`time()` This function will return the number of seconds since the Unix Epoch
### getenv
`getenv(Trace)` This function will return an environment object of the stack `Trace` stacks up
### async
`async(Call,...Arguments)` This function will call the given function in a new thread with the provided arguments
### tostring
`tostring(Argument)` This function will return the given argument as a string
### tofloat
`tofloat(...Arguments)` This function will return the given argument as a float
### toint
`toint(...Arguments)` This function will return the given argument as an int
### assert
`assert(Condition,Message)` This function will throw an error with the given Message if the Condition is false or null
***
## Constants

### \_version
`_version` The current version of Epoxy. This constant is applied to any library, as it is internal to Epoxy
### env
`env` The environment of Epoxy, everything in the standard library
***
## Libraries

### string
```
string.split(a,b) --Returns a split into an array with b
string.repeat(a,b) --Repeats the string, a, b amount of times
string.starts(a,b) --Returns if a starts with b
string.ends(a,b) --Returns if a ends with b
string.sub(a,b,c) --Returns the JS equivalent to String.substring(a,b,c)
string.subs(a,b,c) --Returns the JS equivalent to String.substr(a,b,c)
string.match(a,b) --Returns a pattern of a matching b
string.reverse(a) --Returns the reverse of a
string.lower(a) --Returns a but all lowercase
string.upper(a) --Returns a but all uppercase
string.char(a) --Returns the char of the char code a
string.byte(a) --Returns the char code of a
```
### array
```
array.has(a,b) --Returns if a has b
array.find(a,b) --Returns the index of b in a
array.reverse(a) --Returns the reverse of a
array.join(a,b) --Returns a string of all values in a joined by b
array.append(a,b) --Appends b to the end of a
array.prepend(a,b) --Prepends b to the front of a
array.remove(a,b) --Removes b index in a
array.pop(a) --Removes the last element in a
array.prepop(a) --Removes the first element in a
array.each(a,b) --Iterates through a with b, (value,key,array)=>...
```
### bit
```
bit.and(a,b) --Returns the bitwise and operation on a and b
bit.or(a,b) --Returns the bitwise or operation on a and b
bit.xor(a,b) --Returns the bitwise xor operation on a and b
bit.not(a) --Returns the bitwise not operation on a
bit.rshift(a,b) --Returns the bitwise right-shift operation on a and b
bit.lshift(a,b) --Returns the bitwise left-shift operation on a and b
```
### thread
```
thread.get() --Returns the current running thread
thread.yield(Thread) --Yields the given thread
thread.resume(Thread,...Arguments) --Resumes the given thread, but passes the arguments to where the thread was yielded (i.e thread.yield())
thread.async(Call,...Arguments) --Same functionality as the "async" function, but it shouldn't have to wait for an event loop to start
thread.suspend(Thread,Time) --Yields the given thread until Time seconds have passed
thread.genasync(Call) --Returns an asynchronous proxy function to prevent memory issues with thread.async or async
```
### math
```
math.sin(x) --Returns the sin of x
math.cos(x) --Returns the cos of x
math.tan(x) --Returns the tan of x
math.asin(x) --Returns the asin of x
math.acos(x) --Returns the acos of x
math.atan(x) --Returns the atan of x
math.atan2(y,x) --Returns the atan2 of y and x
math.floor(x) --Returns the floor of x
math.ceil(x) --Returns the ceil of x
math.round(x) --Rounds x to the nearest integer
math.nround(x,b) --Rounds x to the nearest decimal place b
math.sqrt(x) --Returns the sqrt of x
math.pow(x,y) --Returns x ^ y
math.log(x) --Returns the ln of x
math.abs(x) --Returns the absolute value of x
math.log10(x) --Returns the log of x
math.logb(x,b) --Returns the log of x with base b
math.rad(x) --Returns x in radians
math.deg(x) --Returns x in degrees
math.random(min,max) --Returns a random number from min to max
math.nroot(x,b) --Returns the nth-root of x at b 
math.max(...Arguments) --Returns the max in the provided arguments
math.min(...Arguments) --Returns the min in the provided arguments
math.clamp(x,min,max) --Returns x clamped between min and max
math.pi --Pi Constant
math.e --E Constant
```
### json
```
json.encode(x) --Encodes x with json
json.decode(x) --Decodes x with json
```
### regex
```
regex.new(pattern,flags) --Returns a new RegExp object with the given pattern and flags. Requires knowledge in JavaScript RegExp
```
### debug
```
debug.varlen() --Returns the number of variables in the current stack
debug.gvarlen() --Returns the total number of variables in the current stack and all its parents
debug.newvar(Name,Value) --Creates a variable in the given stack with Name and Value
debug.delvar(Name) --Deletes the variable with a name of Name in the current stack
debug.getvar(Name) --Returns the value of the variable with a name of Name in the current stack
debug.read(Name) --Returns an internal setting for Epoxy to manipulate stacks
```
