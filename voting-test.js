const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const Voting = artifacts.require("Voting");


contract("Voting", async accounts => {

    var votingInstance;
 
    const owner = accounts[0];
    const voter1, nonadmin = accounts[1];
    const voter2 = accounts[2];
    const nonvoter = accounts[3];

    beforeEach('Seul l’administrateur devrait être en mesure d’inscrire les électeurs', async () => {
        votingInstance = await Voting.new({from: owner});
    });

    it("Seul l’administrateur devrait être en mesure d’inscrire les électeurs", async () => {
        await expectRevert.unspecified(votingInstance.addVoter(owner, {from: nonadmin}));
    });

    it("Un compte est ajouté par l’administrateur ", async function(){
        let res = await votingInstance.addVoter(voter1, {from: owner});
        let list = await votingInstance.getVoter();

        expect(list[0]).to.equal(voter1);
        await expectEvent(res, "VoterRegistrered", {voterAddress: voter1}, "VoterRegistrered incorrect");
        });

    // un électeur ne peut être inscrit qu’une seule fois
    it("Un compte ne peut être enregistré qu’une seule fois par l’administrateur", async function(){
        await votingInstance.addVoter(voter1, {from: owner});
        await expectRevert.unspecified(votingInstance.addVoter(voter1, {from: owner}));
        });

    it("Seul l’administrateur doit pouvoir démarrer la session d’enregistrement de la proposition", async () => {
        await expectRevert.unspecified(votingInstance.startProposalsRegistering({from: nonvoter}));
    });

      it("Seul l’administrateur doit être en mesure de mettre fin à la session d’inscription à la proposition", async () => {
        await expectRevert.unspecified(votingInstance.endProposalsRegistering({from: voter1}));
    });
    
    // seul l’administrateur peut commencer et terminer la session de vote
    it("Seul l’administrateur devrait pouvoir démarrer la session de vote", async () => {
        await expectRevert.unspecified(votingInstance.startVotingSession({from: voter1}));
    });

    it("Seul l’administrateur doit pouvoir mettre fin à la session de vote", async () => {
        await expectRevert.unspecified(votingInstance.endVotingSession({from: voter1}));
    });

    // Enregistrement d'une proposition par un voteur
    it("Une proposition est enregistrée par un électeur : un événement est annulé", async function(){
        await votingInstance.addVoter(voter1, {from: owner});
        await votingInstance.startProposalsRegistering({from: owner});
        let respropadd = await votingInstance.addProposal("proposition1", {from: voter1});
        
        await expectEvent(respropadd, "ProposalRegistred");

        });

    // Un électeur non inscrit ne peut pas soumettre de proposition
    it("Une proposition ne peut pas être enregistrée par un non-vote", async function(){
        await votingInstance.addVoter(voter1, {from: owner});
        await votingInstance.startProposalsRegistering({from: owner});
        
        await expectRevert.unspecified(votingInstance.addProposal("Proposition2", {from: nonvoter}));
        
        });

    // un électeur inscrit ne peut soumettre une proposition qu’après que l’administrateur a commencé la session
    it("Une proposition n’est enregistrée par un électeur qu’après le début de la session par l’administrateur", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await expectRevert.unspecified(votingInstance.addProposal("Proposition2", {from: voter1}));
        });

    // un électeur ne peut pas voter avant que la séance de vote n’ait été autorisée par l’admin
    it("Un électeur ne peut pas voter avant que la séance de vote ne soit autorisée par l’admin", async function(){
        await votingInstance.addVoter(voter1, {from: owner});
        await votingInstance.startProposalsRegistering({from: owner});
        await votingInstance.addProposal("Proposition2", {from: voter1});
        await votingInstance.endProposalsRegistering({from: owner});
        await votingInstance.startVotingSession({from: owner});
        await expectRevert.unspecified(votingInstance.setVote(0, {from: voter1}));
        
        });

     // un électeur ne peut voter qu’une seule fois
     it("un électeur ne peut voter qu’une seule fois", async function(){
        await votingInstance.addVoter(voter1, {from: owner});
        await votingInstance.startProposalsRegistering({from: owner});
        await votingInstance.addProposal("Proposition1", {from: voter1});
        await votingInstance.endProposalsRegistering({from: owner});
        await votingInstance.startVotingSession({from: owner});
        await votingInstance.setVote(0, {from: voter1});

        await expectRevert.unspecified(votingInstance.setVote(0, {from: voter1}));
        
        });

        //un non-électeur ne peut pas voter
        it("un non-électeur ne peut pas voter", async function(){
            await votingInstance.addVoter(voter1, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("Proposition1", {from: voter1});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter1});
    
            await expectRevert.unspecified(votingInstance.setVote(0, {from: nonvoter}));
            
            });

        //un électeur ne peut pas voter après la fin de la session de vote par l’administrateur
        it("Un électeur ne peut pas voter après la fin de la session par l’administrateur", async function(){
            await votingInstance.addVoter(voter1, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("Proposition1", {from: voter1});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter1});
            await votingInstance.endVotingSession({from: owner});
    
            await expectRevert.unspecified(votingInstance.setVote(0, {from: voter1}));
            
            });

            //seul l’administrateur doit être autorisé à mettre fin à la session de vote
            it("Seul l’administrateur peut mettre fin à la session de vote", async function(){
                await votingInstance.addVoter(voter1, {from: owner});
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Proposition1", {from: voter1});
                await votingInstance.endProposalsRegistering({from: owner});
                await votingInstance.startVotingSession({from: owner});
                await votingInstance.setVote(0, {from: voter1});
                
        
                await expectRevert.unspecified(votingInstance.endVotingSession({from: voter1}));
                
                });

            //seul l’admin peut compter les votes
            it("seul l’admn peut compter les votes", async function(){
                await votingInstance.addVoter(voter1, {from: owner});
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Proposition1", {from: voter1});
                await votingInstance.endProposalsRegistering({from: owner});
                await votingInstance.startVotingSession({from: owner});
                await votingInstance.setVote(0, {from: voter1});
                await votingInstance.endVotingSession({from: owner});
                await expectRevert.unspecified(votingInstance.tallyVotesDraw({from: voter1}));
                
                });



    }
  )