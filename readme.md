# a tool for auto migrate antd form v3 to v4

## get start

1. `npm install --save-dev antdFM`

2. `antdFM -f ./form.js`

3. when you migration successful, then `npm uninstall --save-dev antdFM`

### options 
-- -f, --filename: specify want to tranform file path
-- -p, --prettirerc: specify prettirerc file path, default use current project prettire config 

#### how to transform

```jsx
// before
    <Form onSubmit={this.handleSubmit} className="login-form">
        <Form.Item>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: 'Please input your username!' }],
            initialValue: 'AshoneA',
          })(
            <Input
              prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Username"
            />,
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('password', {
            initialValue: '123456',
            rules: [{ required: true, message: 'Please input your Password!' }],
          })(
            <Input
              prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
              type="password"
              placeholder="Password"
            />,
          )}
        </Form.Item>
      </Form>

// after
  <Form
    onSubmit={this.handleSubmit}
    className="login-form"
    initialValue={{
      username: 'AshoneA',
      password: '123456'
    }}
  >
    <Form.Item
      name="username"
      rules={[
        {
          required: true,
          message: 'Please input your username!'
        }
      ]}
    >
      <Input
        prefix={
          <Icon
            type="user"
            style={{
              color: 'rgba(0,0,0,.25)'
            }}
          />
        }
        placeholder="Username"
      />
    </Form.Item>
    <Form.Item
      name="password"
      rules={[
        {
          required: true,
          message: 'Please input your Password!'
        }
      ]}
    >
      <Input
        prefix={
          <Icon
            type="lock"
            style={{
              color: 'rgba(0,0,0,.25)'
            }}
          />
        }
        type="password"
        placeholder="Password"
      />
    </Form.Item>
  </Form>

```
