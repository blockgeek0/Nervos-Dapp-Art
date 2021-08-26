pragma solidity >=0.8.0;

//Creatas 3 painting to vote

contract ArtVote {
  uint storedData;

  uint private MAX_GOGH_SIZE = 3;
  mapping(uint => VanGogh) public arts;
  
  constructor(){
    createInitialGoghs();
  }

  struct VanGogh{
    uint artId;
    uint votes;
  }
  
  function createInitialGoghs() private{
    for(uint i=1; i<= MAX_GOGH_SIZE;i++){
      arts[i] = VanGogh(i,0);
    } 
  }

  function sendVote(uint _artId) external{
    require(_artId <= MAX_GOGH_SIZE && _artId >=1,"Invalid Art" );
    arts[_artId].votes +=1 ;
  }
}