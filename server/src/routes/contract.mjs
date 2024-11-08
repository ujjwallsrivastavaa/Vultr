import { Router } from "express";
import { Contract } from "../mongoose/contract.mjs";

const router = Router();


router.get("/api/contract", async (req, res) => {
  if(req.user){

  const { id } = req.query;

  if (!id) {
    return res.status(400).send({ msg: "Contract ID is required" });
  }

  try {
    const contract = await Contract.findOne({ ContractId: id });


    if (!contract) {
      console.log("herw")
      return res.status(200).send({ msg: "Contract not found" });
    }

    if (contract.FarmerId.toString() !== req.user._id.toString()  && contract.BuyerId.toString() !== req.user._id.toString()) {

      return res.status(200).send({ msg: "Contract not found" });
    }

    // Remove FarmerId and BuyerId
    const contractObj = contract.toObject(); // Convert Mongoose Document to plain JavaScript object
    delete contractObj.FarmerId;
    delete contractObj.BuyerId;
    delete contractObj._id;
    if (contractObj.initialpaymentStatus !== "Received") {
      contractObj.currentStatus = [
        "Initial Payment ",
        contractObj.initialpaymentStatus,
      ];
    } else if (contractObj.deliveryStatus !== "Received") {
      contractObj.currentStatus = [
        "Product Delivery ",
        contractObj.deliveryStatus,
      ];
    } else {
      contractObj.currentStatus = [
        "Final Payment ",
        contractObj.finalpaymentStatus,
      ];
    }
   
    res.status(200).send({
      msg: "Contract found",
      data: {user : {name :req.user.name,userType : req.user.userType,email:req.user.email,phone : req.user.phone},contract:contractObj}
    });

  } catch (err) {
    res.status(500).send({ msg: "An error occurred", error: err.message });
  }
}else{
  res.status(404).send({ msg: "user not found" });

}
});

router.post("/api/contract", async (req, res) => {
  console.log("call came");
  if (req.user) {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send({ msg: "Contract ID is required" });
    }

    try {
      const contract = await Contract.findOne({ ContractId: id });

      if (!contract) {
        console.log("Contract not found");
        return res.status(404).send({ msg: "Contract not found" });
      }

      if (contract.FarmerId.toString() !== req.user._id.toString() && contract.BuyerId.toString() !== req.user._id.toString()) {
        return res.status(403).send({ msg: "Unauthorized access" });
      }

      const statusArray = req.body; // Assuming this is an array of strings
      const contractObj = contract.toObject();
      console.log(statusArray)
      statusArray.forEach(element => {
        const array = element.split(" ");
        if (array[0] === "Initial") {
          contractObj.initialpaymentStatus = array[array.length - 1];
        } else if (array[0] === "Final") {
          contractObj.finalpaymentStatus = array[array.length - 1];
        } else {
          contractObj.deliveryStatus = array[array.length - 1];
        }
      });
      if(contractObj.finalpaymentStatus === "Received"){
        contractObj.contractStatus = "Completed";
      }

      // Save the updated contract
      await Contract.findByIdAndUpdate(contract._id, contractObj);

      return res.status(200).send({ msg: "Status Updated Successfully",contractStatus : contractObj.contractStatus });
      
    } catch (err) {
      res.status(500).send({ msg: "An error occurred", error: err.message });
    }
  } else {
    res.status(404).send({ msg: "User not found" });
  }
});

export default router;