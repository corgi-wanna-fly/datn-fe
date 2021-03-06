import React, { useState, useEffect } from "react";
import { getAllProvince } from "../api/ProvinceApi";
import { getCartItemByAccountId } from "../api/CartApi";
import { useForm } from "react-hook-form";
import { createOrder } from "../api/OrderApi";
import { toast } from "react-toastify";
import { NavLink, useHistory } from "react-router-dom";
import { getVoucherByCode } from "../api/VoucherApi";
import {getPaypalPayment} from '../api/PaymenApi'
import {getAccountDetailByAccountId} from '../api/AccountApi'

const Checkout = (props) => {
  const [amount, setAmount] = useState();
  const [cart, setCart] = useState([]);
  const [info, setInfo] = useState();
  const [district, setDistrict] = useState();
  const [ward, setWard] = useState();
  const [voucher, setVoucher] = useState("");
  const [flag, setFlag] = useState(false);
  const [sub, setSub] = useState();
  const [payment, setPayment] = useState(false);
  const history = useHistory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    onLoad();
  }, []);

  const onLoad = () => {
    getAllProvince().then((resp) => setInfo(resp.data));
    getCartItemByAccountId(2).then((resp) => {
      setCart(resp.data.filter((item) => props.buy.includes(item.id + "")));
      const result = resp.data
        .filter((item) => props.buy.includes(item.id + ""))
        .reduce(
          (price, item) =>
            price + (item.price * item.quantity * (100 - item.discount)) / 100,
          0
        );
      setAmount(result);
    });
    props.changeHeaderHandler(3);
  };

  const voucherHandler = (value) => {
    setVoucher(value);
  };

  const useVoucherHandler = () => {
    if (flag) {
      toast.warning("Voucher đã được áp dụng.");
    } else {
      getVoucherByCode(voucher)
        .then((resp) => {
          setAmount(
            (prevState) => (prevState * (100 - resp.data.discount)) / 100
          );
          setFlag(true);
          toast.success("Áp dụng voucher thành công.");
          setSub((amount * resp.data.discount) / 100);
        })
        .catch((error) => toast.error(error.response.data.Errors));
    }
  };

  const refreshVoucherHandler = () => {
    setFlag(false);
    setVoucher("");
    setSub("");
    onLoad();
  };
  const onLoadDistrictHandler = (id) => {
    const resp = info.filter((item) => item.name === id);
    setDistrict(resp[0].districts);
  };

  const onLoadWardHandler = (id) => {
    const resp = district.filter((item) => item.name === id);
    setWard(resp[0].wards);
  };

  const onSubmitHandler = async (data) => {
    const order = {
      fullname: data.name,
      phone: data.phone,
      address: `${data.address}, ${data.ward}, ${data.district}, ${data.province}`,
      email: data.email,
      total: amount,
      note: data.note,
      isPending: data.payment,
      accountId: 2,
      code: voucher,
      orderDetails: cart.map((item) => ({
        quantity: item.quantity,
        originPrice: item.price,
        sellPrice: (item.price * (100 - item.discount)) / 100,
        attribute: {
          id: item.id,
        },
      })),
    };
    if(payment){
      // console.log(order)
      // getPaypalPayment(order)
      // .then((res) => history.push(res.data))
      // .catch((error) => history.push('/error-page'))
      history.push('/payment-page');
      console.log(order);
    }else{
      try {
        await createOrder(order).then((resp) => {
          toast.success("Đặt hàng thành công");
          history.push(`/order/detail/${resp.data.id}`);
        });
      } catch (error) {
        history.push("/out-of-stock");
      }
    }
  };
  
  const changePaymentHandler = (value) =>{
    setPayment(value);
  }
  return (
    <div className="pb-3 container-fluid">
      <div className="py-3 col-10 offset-1 text-center">
        <h2 className="text-danger">Thông tin mua hàng</h2>
      </div>
      <div className="row">
        <div className="col-md-5 col-lg-4 order-md-last">
          <h4 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-dark">Giỏ hàng của bạn</span>
            <span className="badge bg-primary rounded-pill">{cart.length}</span>
          </h4>
          <ul className="list-group mb-3">
            {cart &&
              cart.map((item, index) => (
                <li
                  className="list-group-item d-flex justify-content-between lh-sm"
                  key={index}
                >
                  <div>
                    <h6 className="my-0">
                      {item.name} - {item.size}
                    </h6>
                    <small className="text-muted">
                      {(
                        (item.price * (100 - item.discount)) /
                        100
                      ).toLocaleString()}{" "}
                      x {item.quantity}
                    </small>
                  </div>
                  <strong>
                    {(
                      ((item.price * (100 - item.discount)) / 100) *
                      item.quantity
                    ).toLocaleString()}
                  </strong>
                </li>
              ))}
            <li className="list-group-item d-flex justify-content-between bg-light">
              <div className="text-success">
                <h6 className="my-2">Mã giảm giá</h6>
                <input
                  className="form-control my-2"
                  value={voucher}
                  disabled={flag}
                  type="text"
                  onChange={(e) => voucherHandler(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary mr-3"
                  onClick={useVoucherHandler}
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={refreshVoucherHandler}
                >
                  Làm mới
                </button>
              </div>
            </li>
            {sub && (
              <li className="list-group-item d-flex justify-content-between">
                <span>Giá giảm (VND)</span>
                <strong>- {sub.toLocaleString()}</strong>
              </li>
            )}
            <li className="list-group-item d-flex justify-content-between">
              <span>Tổng tiền (VND)</span>
              <strong>{amount && amount.toLocaleString()}</strong>
            </li>
          </ul>
          <NavLink
            to="/cart"
            className={cart.length === 0 ? "mb-2 mr-5 disabled" : "mb-2 mr-5"}
            exact
          >
            Quay về giỏ hàng
          </NavLink>
        </div>
        <div className="col-md-7 col-lg-8">
          <h4 className="mb-3">Địa chỉ nhận hàng</h4>
          <form
            className="needs-validation"
            onSubmit={handleSubmit(onSubmitHandler)}
          >
            <div className="row g-3">
              <div className="col-sm-6">
                <label htmlFor="firstName" className="form-label">
                  <strong>Tỉnh Thành</strong>
                </label>
                <select
                  className="form-control"
                  {...register("province", { required: true })}
                  required
                  onChange={(e) => onLoadDistrictHandler(e.target.value)}
                >
                  <option selected disabled hidden></option>
                  {info &&
                    info.map((item, index) => (
                      <option key={index} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-sm-6">
                <label htmlFor="lastName" className="form-label">
                  <strong>Quận Huyện</strong>
                </label>
                <select
                  className="form-control"
                  {...register("district", { required: true })}
                  required
                  onChange={(e) => onLoadWardHandler(e.target.value)}
                >
                  <option selected disabled hidden></option>
                  {district &&
                    district.map((item, index) => (
                      <option key={index} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-sm-6 mt-2">
                <label htmlFor="lastName" className="form-label">
                  <strong>Phường Xã</strong>
                </label>
                <select
                  className="form-control"
                  {...register("ward", { required: true })}
                  required
                >
                  <option selected disabled hidden></option>
                  {ward &&
                    ward.map((item, index) => (
                      <option value={item.name} key={index}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-12 mt-2">
                <label htmlFor="address" className="form-label">
                  <strong>Địa chỉ</strong>
                </label>
                <textarea
                  className="form-control"
                  id="exampleFormControlTextarea1"
                  rows={3}
                  defaultValue={""}
                  {...register("address", {
                    required: true,
                    pattern: /^\s*\S+.*/,
                  })}
                />
                {errors.address && (
                  <div className="alert alert-danger" role="alert">
                    Địa chỉ không hợp lệ!
                  </div>
                )}
              </div>

              <div className="col-sm-6 mt-2">
                <label htmlFor="lastName" className="form-label">
                  <strong> Họ tên</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  {...register("name", {
                    required: true,
                    pattern: /^\s*\S+.*/,
                  })}
                />
                {errors.name && (
                  <div className="alert alert-danger" role="alert">
                    Họ tên không hợp lệ!
                  </div>
                )}
              </div>
              <div className="col-sm-6 mt-2">
                <label htmlFor="lastName" className="form-label">
                  <strong>Số điện thoại</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  {...register("phone", {
                    required: true,
                    pattern: /^0[0-9]{9}$/,
                  })}
                />
                {errors.phone && (
                  <div className="alert alert-danger" role="alert">
                    Số điện thoại không hợp lệ!
                  </div>
                )}
              </div>
              <div className="col-sm-6 mt-2">
                <label htmlFor="lastName" className="form-label">
                  <strong> Email</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  {...register("email", {
                    required: true,
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  })}
                />
                {errors.email && (
                  <div className="alert alert-danger" role="alert">
                    Email không hợp lệ!
                  </div>
                )}
              </div>
              <div className="col-12 mt-2">
                <label htmlFor="address" className="form-label">
                  <strong>Ghi chú</strong>
                </label>
                <textarea
                  className="form-control"
                  id="exampleFormControlTextarea1"
                  rows={3}
                  defaultValue={""}
                  {...register("note", { required: false })}
                />
              </div>
            </div>
            <label htmlFor="lastName" className="form-label mt-3">
              <strong>Phương thức thanh toán</strong>
            </label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="exampleRadios"
                id="exampleRadios1"
                checked
                value="false"
                {...register("payment", { required: true })}
                onChange={(e) => changePaymentHandler(e.target.value)}
              />
              <label className="form-check-label" htmlFor="exampleRadios1">
                Thanh toán khi giao hàng(COD) <br />
              </label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="radio"
                name="exampleRadios"
                id="exampleRadios2"
                value="true"
                {...register("payment", { required: true })}
                onChange={(e) => changePaymentHandler(e.target.value)}
              />
              <label className="form-check-label" htmlFor="exampleRadios2">
                Thanh toán qua Paypal <br />
              </label>
            </div>
            <button
              className="btn btn-primary btn-lg mt-5 mb-5"
              type="submit"
              style={{ marginLeft: 680 }}
            >
              Đặt hàng
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
