import api from "../services/api";

export const FamiliaService = {

 async getPaginated(page:number,size:number,search="") {

  const empresaId = localStorage.getItem("empresaId");

  const res = await api.get("/familias",{
    params:{
      empresaId,
      page,
      size,
      search
    }
  });

  return res.data;
},

  async create(data:any){

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(
      "/familias",
      data,
      {
        params:{ empresaId }
      }
    );

    return res.data;
  },

  async update(id:string,data:any){

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(
      `/familias/${id}`,
      data,
      {
        params:{ empresaId }
      }
    );

    return res.data;
  },

  async remove(id:string){

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/familias/${id}`,{
      params:{ empresaId }
    });

    return res.data;
  }

};