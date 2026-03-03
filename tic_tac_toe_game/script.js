const cell = document.querySelectorAll(".upper");
const text = document.querySelector("#status");
const start = document.querySelector("#restartbutton");
const win = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
];
let options = ["","","","","","","","",""]
let first_player="X";
let run = false;
gameintilaization();

function gameintilaization(){
    cell.forEach(upper =>upper.addEventListener("click",clicked))
    start.addEventListener("click",restartgame);
    text.textContent=`${first_player}'s turn`
    run=true;
}
function clicked(){
    const upperindex = this.getAttribute("cellIndex");
    if(options[upperindex]!="" || !run){
        return;
    }
    update(this,upperindex);  
    winner();

}
function update(upper,index){
options[index]=  first_player;
upper.textContent=first_player;
}
function second_player(){
first_player=(first_player=="X")?"O":"X";
text.textContent=`${first_player}'s turn`;
}
function winner(){
let playerwon = false;
for(i=0;i<win.length;i++){
    const condition = win[i];
    const upper_one = options[condition[0]]
    const upper_two = options[condition[1]]
    const upper_three = options[condition[2]]
    if(upper_one==""||upper_two==""|| upper_three ==""){
        continue;
    }
    if(upper_one==upper_two&&upper_two==upper_three){
        playerwon=true;
        break;
    }
}
if(playerwon==true){
    text.textContent=`${first_player} wins`;
    run=false;
}
else if(!options.includes("")){
    text.textContent=`draw!`;
    run=false;
}
else{
    second_player();
}
}
function restartgame(){
first_player="X";
options = ["","","","","","","","",""]
text.textContent=`${first_player}'s turn`;
cell.forEach(upper=>upper.textContent="");
run=true;
}